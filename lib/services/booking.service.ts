import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/google/calendar";
import { AppError } from "@/lib/errors";

interface BookingInput {
    slot: any;
    userId: string;
    mentorUserId: string;
    learnerProfile: any;
    mentorProfile: any;
}

export async function processBooking(input: BookingInput) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  // 1️⃣ Just insert booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id: input.slot.id,
      student_id: input.userId,
      mentor_id: input.mentorUserId,
      status: "SCHEDULED",
    })
    .select("id")
    .single();

  if (bookingError) {
    // Unique constraint OR trigger error
    if (
      bookingError.message.includes("Slot capacity exceeded") ||
      bookingError.code === "23505"
    ) {
      throw new AppError(
        "SLOT_FULL",
        "This session is already booked.",
        409
      );
    }

    throw new AppError(
      "BOOKING_FAILED",
      "Unable to create booking.",
      500
    );
  }

  const jitsiMeetLink = `https://meet.jit.si/zuvy-${booking.id}`;
  let calendarEventId: string | null = null;

  // 2️⃣ Calendar (non-blocking)
  try {
    const calResult = await createCalendarEvent({
      summary: `Zuvy Mentorship Session`,
      description: `Join: ${jitsiMeetLink}`,
      startIso: input.slot.slot_start,
      endIso: input.slot.slot_end,
      attendeeEmails: [],
    });

    calendarEventId = calResult.eventId;
  } catch (err) {
    console.error("Calendar failed, continuing without it:", err);
  }

  // 3️⃣ Update booking with meeting info
  await supabase
    .from("bookings")
    .update({
      meet_link: jitsiMeetLink,
      calendar_event_id: calendarEventId,
    })
    .eq("id", booking.id);

  // 4️⃣ Notify mentor
  try {
    await serviceSupabase.from("notifications").insert({
      user_id: input.mentorUserId,
      type: "BOOKING_CONFIRMED",
      title: "New session booked",
      message: `${input.learnerProfile?.name ?? "A learner"} booked a session.`,
      reference_id: booking.id,
      reference_type: "booking",
    });
  } catch {}

  return {
    bookingId: booking.id,
    meetLink: jitsiMeetLink,
    calendarEventId,
  };
}