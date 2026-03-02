import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google/calendar";

/**
 * POST /api/bookings
 * Creates a booking for the authenticated learner.
 * Body: { slotId: string }
 *
 * After booking succeeds:
 *  1. Creates a Google Calendar event with a Google Meet link
 *  2. Stores meet_link + calendar_event_id on the booking row
 *  3. Email invitations are sent automatically to both parties
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slotId } = body as { slotId?: string };

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  // Load slot + mentor profile (to get mentor's profiles.id)
  const { data: slot, error: slotError } = await supabase
    .from("mentor_slots")
    .select(`
      id,
      mentor_id,
      current_booked_count,
      max_capacity,
      status,
      slot_start,
      slot_end,
      duration_minutes,
      mentor_profiles!mentor_slots_mentor_id_fkey (
        user_id,
        title
      )
    `)
    .eq("id", slotId)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (slot.status !== "available" || slot.current_booked_count >= slot.max_capacity) {
    return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
  }

  if (new Date(slot.slot_start) <= new Date()) {
    return NextResponse.json({ error: "Slot has already passed" }, { status: 409 });
  }

  // Prevent double-booking this slot
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_id", slotId)
    .eq("student_id", user.id)
    .neq("status", "CANCELLED")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already booked this slot" }, { status: 409 });
  }

  const mentorProfiles = slot.mentor_profiles as { user_id: string; title: string | null } | null;
  const mentorUserId = mentorProfiles?.user_id;
  if (!mentorUserId) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  // Fetch mentor + learner emails for calendar invites
  const [{ data: mentorProfile }, { data: learnerProfile }] = await Promise.all([
    supabase.from("profiles").select("email, name").eq("id", mentorUserId).single(),
    supabase.from("profiles").select("email, name").eq("id", user.id).single(),
  ]);

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id: slotId,
      student_id: user.id,
      mentor_id: mentorUserId,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Booking insert error:", bookingError);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Increment booked count — use service client to bypass RLS (student session cannot update mentor_slots)
  const serviceSupabase = await createServiceClient();
  await serviceSupabase
    .from("mentor_slots")
    .update({ current_booked_count: slot.current_booked_count + 1 })
    .eq("id", slotId);

  // ── Google Calendar event ────────────────────────────────────────────────
  // Runs after booking is committed — failure here does NOT roll back the booking
  let meetLink: string | null = null;
  let calendarEventId: string | null = null;

  try {
    const mentorName = mentorProfile?.name ?? "Mentor";
    const learnerName = learnerProfile?.name ?? "Learner";
    const mentorTitle = mentorProfiles?.title ?? "Mentor";

    const attendeeEmails = [
      mentorProfile?.email,
      learnerProfile?.email,
    ].filter((e): e is string => !!e);

    const startDate = new Date(slot.slot_start);
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
    });

    const calResult = await createCalendarEvent({
      summary: `Zuvy Mentorship Session — ${mentorName} & ${learnerName}`,
      description: [
        `Your mentorship session has been confirmed on Zuvy.`,
        ``,
        `Mentor: ${mentorName} (${mentorTitle})`,
        `Learner: ${learnerName}`,
        `Date: ${formattedDate}`,
        `Time: ${formattedTime}`,
        `Duration: ${slot.duration_minutes} minutes`,
        ``,
        `Join via the Google Meet link above, or visit your Zuvy dashboard.`,
      ].join("\n"),
      startIso: slot.slot_start,
      endIso: slot.slot_end,
      attendeeEmails,
    });

    meetLink = calResult.meetLink;
    calendarEventId = calResult.eventId;

    // Persist meet_link + calendar_event_id on the booking
    await supabase
      .from("bookings")
      .update({ meet_link: meetLink, calendar_event_id: calendarEventId })
      .eq("id", booking.id);

    console.log(
      `[bookings] Calendar event created: ${calendarEventId}, Meet: ${meetLink ?? "none"}`
    );
  } catch (calErr) {
    // Calendar failure is non-fatal — booking is already confirmed
    console.error("[bookings] Google Calendar error (non-fatal):", calErr);
  }

  return NextResponse.json(
    { bookingId: booking.id, meetLink, calendarEventId },
    { status: 201 }
  );
}
