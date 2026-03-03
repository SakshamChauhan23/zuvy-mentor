-- ============================================================
-- Zuvy Mentorship Platform — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helper: auto-update updated_at ───────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users. Auto-populated via trigger on sign-up.
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text        not null,
  name            text,
  profile_picture text,
  role            text        not null default 'learner'
                  check (role in ('learner', 'mentor', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── mentor_profiles ──────────────────────────────────────────────────────────
create table if not exists mentor_profiles (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        references profiles(id) on delete cascade not null unique,
  title               text,
  bio                 text,
  expertise           text[]      not null default '{}',
  timezone            text        not null default 'UTC',
  buffer_minutes      integer     not null default 15,
  is_buffer_enabled   boolean     not null default true,
  accepts_new_mentees boolean     not null default true,
  is_verified         boolean     not null default false,
  status              text        not null default 'active'
                      check (status in ('active', 'inactive', 'suspended')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger mentor_profiles_updated_at
  before update on mentor_profiles
  for each row execute function update_updated_at();

-- ── mentor_slots ─────────────────────────────────────────────────────────────
create table if not exists mentor_slots (
  id                   uuid        primary key default uuid_generate_v4(),
  mentor_id            uuid        references mentor_profiles(id) on delete cascade not null,
  slot_start           timestamptz not null,
  slot_end             timestamptz not null,
  duration_minutes     integer     not null
                       generated always as (
                         extract(epoch from (slot_end - slot_start))::integer / 60
                       ) stored,
  max_capacity         integer     not null default 1,
  current_booked_count integer     not null default 0,
  topic                text,
  status               text        not null default 'available'
                       check (status in ('available', 'full', 'cancelled')),
  is_public            boolean     not null default true,
  recurrence_rule      text,       -- RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO"
  recurrence_end_date  timestamptz,
  recurrence_group_id  uuid,       -- groups all instances of a recurring slot
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint slot_end_after_start check (slot_end > slot_start)
);

create trigger mentor_slots_updated_at
  before update on mentor_slots
  for each row execute function update_updated_at();

-- Index: fast lookup of a mentor's upcoming available slots
create index if not exists idx_mentor_slots_mentor_status
  on mentor_slots (mentor_id, status, slot_start);

-- ── bookings ─────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                   uuid        primary key default uuid_generate_v4(),
  slot_id              uuid        references mentor_slots(id) on delete restrict not null,
  student_id           uuid        references profiles(id) on delete restrict not null,
  mentor_id            uuid        references profiles(id) on delete restrict not null,
  status               text        not null default 'SCHEDULED'
                       check (status in (
                         'SCHEDULED', 'IN_PROGRESS', 'COMPLETED',
                         'CANCELLED', 'MISSED', 'RESCHEDULE_PENDING'
                       )),
  -- cancellation
  cancelled_by         text        check (cancelled_by in ('student', 'mentor')),
  cancel_reason        text,
  -- reschedule
  reschedule_new_slot_id uuid      references mentor_slots(id),
  reschedule_reason    text,
  -- attendance
  joined_at            timestamptz,
  left_at              timestamptz,
  completed_at         timestamptz,
  -- feedback (mentor submits after session)
  feedback             jsonb,      -- { notes: string, areasOfImprovement: string }
  rating               integer     check (rating >= 1 and rating <= 5),
  feedback_locked      boolean     not null default false,
  feedback_locked_at   timestamptz,
  -- reminder flags (set by cron/scheduled job)
  reminder_24h_sent    boolean     not null default false,
  reminder_1h_sent     boolean     not null default false,
  -- timestamps
  booked_at            timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- Indexes: student and mentor lookups
create index if not exists idx_bookings_student_id on bookings (student_id);
create index if not exists idx_bookings_mentor_id  on bookings (mentor_id);
create index if not exists idx_bookings_slot_id    on bookings (slot_id);
create index if not exists idx_bookings_status     on bookings (status);

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        references profiles(id) on delete cascade not null,
  type           text        not null,
  -- e.g. SESSION_REMINDER_24H | SESSION_REMINDER_1H | BOOKING_CONFIRMED
  --      BOOKING_CANCELLED | RESCHEDULE_PROPOSED | RESCHEDULE_ACCEPTED
  --      RESCHEDULE_DECLINED | SESSION_COMPLETED | FEEDBACK_RECEIVED
  title          text        not null,
  message        text        not null,
  reference_id   uuid,       -- booking or slot ID this relates to
  reference_type text        check (reference_type in ('booking', 'slot')),
  is_read        boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications (user_id, is_read, created_at desc);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on sign-up
-- ═══════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, profile_picture)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ── mentor_profiles ──────────────────────────────────────────────────────────
alter table mentor_profiles enable row level security;

create policy "Mentor profiles are publicly readable"
  on mentor_profiles for select using (true);

create policy "Mentors can insert their own profile"
  on mentor_profiles for insert with check (auth.uid() = user_id);

create policy "Mentors can update their own profile"
  on mentor_profiles for update using (auth.uid() = user_id);

-- ── mentor_slots ─────────────────────────────────────────────────────────────
alter table mentor_slots enable row level security;

-- Public can read published available slots
create policy "Public slots are readable by all"
  on mentor_slots for select
  using (is_public = true);

-- Mentors can also read their own private/cancelled slots
create policy "Mentors can read their own slots"
  on mentor_slots for select
  using (
    auth.uid() = (
      select user_id from mentor_profiles where id = mentor_id
    )
  );

create policy "Mentors can insert their own slots"
  on mentor_slots for insert
  with check (
    auth.uid() = (
      select user_id from mentor_profiles where id = mentor_id
    )
  );

create policy "Mentors can update their own slots"
  on mentor_slots for update
  using (
    auth.uid() = (
      select user_id from mentor_profiles where id = mentor_id
    )
  );

create policy "Mentors can delete their own slots"
  on mentor_slots for delete
  using (
    auth.uid() = (
      select user_id from mentor_profiles where id = mentor_id
    )
  );

-- ── bookings ─────────────────────────────────────────────────────────────────
alter table bookings enable row level security;

create policy "Students can read their own bookings"
  on bookings for select using (auth.uid() = student_id);

create policy "Mentors can read bookings on their sessions"
  on bookings for select using (auth.uid() = mentor_id);

create policy "Students can create bookings"
  on bookings for insert with check (auth.uid() = student_id);

create policy "Students can update their own bookings"
  on bookings for update using (auth.uid() = student_id);

create policy "Mentors can update bookings they own"
  on bookings for update using (auth.uid() = mentor_id);

-- ── notifications ─────────────────────────────────────────────────────────────
alter table notifications enable row level security;

create policy "Users can read their own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update using (auth.uid() = user_id);

-- Service role (used by Route Handlers / cron) can insert notifications
create policy "Service role can insert notifications"
  on notifications for insert with check (true);

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_idempotency
ON public.bookings(idempotency_key);

--------------------------------New changes-------------------------------
-- Trigger function to enforce slot capacity

SELECT current_database();

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_idempotency
ON public.bookings(idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_slot_booking
ON bookings(slot_id)
WHERE status IN ('SCHEDULED','IN_PROGRESS');

CREATE OR REPLACE FUNCTION enforce_slot_capacity()
RETURNS trigger AS $$
DECLARE
  current_count integer;
  max_cap integer;
BEGIN
  SELECT current_booked_count, max_capacity
  INTO current_count, max_cap
  FROM mentor_slots
  WHERE id = NEW.slot_id
  FOR UPDATE;

  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'Slot capacity exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_slot_capacity ON bookings;

CREATE TRIGGER check_slot_capacity
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'SCHEDULED')
EXECUTE FUNCTION enforce_slot_capacity();


RETURNS trigger AS $$
BEGIN

  IF TG_OP = 'INSERT' AND NEW.status = 'SCHEDULED' THEN
    UPDATE mentor_slots
    SET current_booked_count = current_booked_count + 1
    WHERE id = NEW.slot_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'SCHEDULED'
     AND NEW.status IN ('CANCELLED','MISSED') THEN
    UPDATE mentor_slots
    SET current_booked_count = current_booked_count - 1
    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_count_trigger ON bookings;

CREATE TRIGGER booking_count_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_slot_booking_count();

DROP POLICY IF EXISTS "Students can create bookings" ON bookings;

CREATE POLICY "Students can create bookings"
ON bookings
FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND mentor_id = (
    SELECT mp.user_id
    FROM mentor_slots ms
    JOIN mentor_profiles mp ON mp.id = ms.mentor_id
    WHERE ms.id = slot_id
  )
);

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

CREATE OR REPLACE FUNCTION sync_slot_status()
RETURNS trigger AS $$
DECLARE
  cap integer;
  count_now integer;
BEGIN
  SELECT max_capacity, current_booked_count
  INTO cap, count_now
  FROM public.mentor_slots
  WHERE id = NEW.slot_id;

  -- If capacity reached → mark full
  IF count_now >= cap THEN
    UPDATE public.mentor_slots
    SET status = 'full'
    WHERE id = NEW.slot_id;
  END IF;

  -- If below capacity → mark available
  IF count_now < cap THEN
    UPDATE public.mentor_slots
    SET status = 'available'
    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_slot_status_trigger ON public.bookings;

CREATE TRIGGER sync_slot_status_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION sync_slot_status();

CREATE OR REPLACE FUNCTION enforce_booking_state_transition()
RETURNS trigger AS $$
BEGIN

  -- Prevent illegal transitions
  IF TG_OP = 'UPDATE' THEN

    -- SCHEDULED transitions
    IF OLD.status = 'SCHEDULED'
       AND NEW.status NOT IN ('SCHEDULED','IN_PROGRESS','CANCELLED','MISSED') THEN
      RAISE EXCEPTION 'Invalid status transition from SCHEDULED';
    END IF;

    -- IN_PROGRESS transitions
    IF OLD.status = 'IN_PROGRESS'
       AND NEW.status NOT IN ('IN_PROGRESS','COMPLETED','MISSED') THEN
      RAISE EXCEPTION 'Invalid status transition from IN_PROGRESS';
    END IF;

    -- COMPLETED cannot change
    IF OLD.status = 'COMPLETED'
       AND NEW.status <> 'COMPLETED' THEN
      RAISE EXCEPTION 'Completed booking cannot change state';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_state_guard ON public.bookings;

CREATE TRIGGER booking_state_guard
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION enforce_booking_state_transition();

CREATE OR REPLACE FUNCTION prevent_booking_in_past()
RETURNS trigger AS $$
DECLARE
  slot_time timestamptz;
BEGIN
  SELECT slot_start
  INTO slot_time
  FROM public.mentor_slots
  WHERE id = NEW.slot_id;

  IF slot_time IS NULL THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF slot_time <= now() THEN
    RAISE EXCEPTION 'Cannot book a slot that has already started';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_time_guard ON public.bookings;

CREATE TRIGGER booking_time_guard
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION prevent_booking_in_past();

create function increment_slot_booking(p_slot_id uuid)
returns void
language plpgsql
as $$
begin
  update mentor_slots
  set current_booked_count = current_booked_count + 1
  where id = p_slot_id
  and current_booked_count < max_capacity;

  if not found then
    raise exception 'SLOT_FULL';
  end if;
end;
$$;

create or replace function increment_slot_capacity(slot_uuid uuid)
returns boolean
language plpgsql
as $$
begin
  update mentor_slots
  set current_booked_count = current_booked_count + 1
  where id = slot_uuid
  and current_booked_count < max_capacity;

  if found then
    return true;
  else
    return false;
  end if;
end;
$$;

create or replace function decrement_slot_capacity(slot_uuid uuid)
returns void
language plpgsql
as $$
begin
  update mentor_slots
  set current_booked_count = current_booked_count - 1
  where id = slot_uuid
  and current_booked_count > 0;
end;
$$;


DROP FUNCTION increment_slot_capacity(uuid);
DROP FUNCTION decrement_slot_capacity(uuid);
DROP FUNCTION increment_slot_booking(uuid);

CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  IF TG_OP = 'INSERT' AND NEW.status = 'SCHEDULED' THEN
    UPDATE public.mentor_slots
    SET current_booked_count = current_booked_count + 1
    WHERE id = NEW.slot_id;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'SCHEDULED'
     AND NEW.status IN ('CANCELLED','MISSED') THEN
    UPDATE public.mentor_slots
    SET current_booked_count = current_booked_count - 1
    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION update_slot_booking_count() OWNER TO postgres;