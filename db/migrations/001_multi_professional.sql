CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE professionals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
 photo text NOT NULL DEFAULT '/images/avatar-placeholder.svg', description text NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT false, google_calendar_id text UNIQUE,
 legacy_calendar boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_legacy_calendar ON professionals (legacy_calendar) WHERE legacy_calendar;
CREATE TABLE services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_key text UNIQUE, name text NOT NULL,
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 5 AND 480),
 price integer NOT NULL CHECK(price >= 0), active boolean NOT NULL DEFAULT true
);
CREATE TABLE professional_services (
 professional_id uuid REFERENCES professionals ON DELETE CASCADE,
 service_id uuid REFERENCES services ON DELETE CASCADE, PRIMARY KEY(professional_id,service_id)
);
CREATE TABLE working_hours (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), professional_id uuid NOT NULL REFERENCES professionals ON DELETE CASCADE,
 day_of_week integer NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
 start_minute integer NOT NULL CHECK(start_minute BETWEEN 0 AND 1439),
 end_minute integer NOT NULL CHECK(end_minute BETWEEN 1 AND 1440), CHECK(start_minute < end_minute),
 EXCLUDE USING gist (professional_id WITH =, day_of_week WITH =, int4range(start_minute,end_minute,'[)') WITH &&)
);
CREATE TABLE availability_exceptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), professional_id uuid NOT NULL REFERENCES professionals ON DELETE CASCADE,
 date_from date NOT NULL, date_to date NOT NULL, kind text NOT NULL CHECK(kind IN ('BLOCK','CLOSED','HOURS')),
 start_minute integer CHECK(start_minute BETWEEN 0 AND 1439), end_minute integer CHECK(end_minute BETWEEN 1 AND 1440),
 reason text NOT NULL DEFAULT '', CHECK(date_from <= date_to),
 CHECK(kind='CLOSED' OR (start_minute IS NOT NULL AND end_minute IS NOT NULL AND start_minute<end_minute))
);
CREATE TABLE bookings (
 id uuid PRIMARY KEY, professional_id uuid NOT NULL REFERENCES professionals, service_id uuid NOT NULL REFERENCES services,
 customer_name text NOT NULL, customer_phone text NOT NULL, customer_email text,
 start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, status text NOT NULL
 CHECK(status IN ('PENDING','CONFIRMED','CANCEL_PENDING','MOVE_PENDING','SYNC_ERROR','CANCELED')),
 notes text NOT NULL DEFAULT '', google_event_id text NOT NULL, google_calendar_id text NOT NULL,
 service_name text NOT NULL, duration_minutes integer NOT NULL, price integer NOT NULL,
 pending_action text CHECK(pending_action IN ('CREATE','CANCEL','MOVE')), target_start timestamptz, target_end timestamptz,
 sync_error text, synced_at timestamptz, idempotency_key uuid UNIQUE, request_hash text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(start_at<end_at), UNIQUE(google_calendar_id,google_event_id)
);
-- A durable hold survives API timeouts and process crashes. No automatic expiry:
-- an uncertain Calendar write must be reconciled before freeing the interval.
CREATE TABLE booking_holds (
 booking_id uuid PRIMARY KEY REFERENCES bookings ON DELETE CASCADE,
 professional_id uuid NOT NULL REFERENCES professionals, calendar_id text NOT NULL,
 start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, CHECK(start_at<end_at),
 EXCLUDE USING gist (professional_id WITH =, tstzrange(start_at,end_at,'[)') WITH &&),
 EXCLUDE USING gist (calendar_id WITH =, tstzrange(start_at,end_at,'[)') WITH &&)
);
CREATE INDEX bookings_agenda ON bookings(professional_id,start_at);
CREATE TABLE admin_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('OWNER','PROFESSIONAL')),
 professional_id uuid UNIQUE REFERENCES professionals, can_block boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT true, CHECK(role='OWNER' OR professional_id IS NOT NULL)
);
CREATE TABLE admin_sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES admin_users ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE TABLE rate_limits (
 key text PRIMARY KEY, count integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL
);
CREATE TABLE booking_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_id uuid REFERENCES bookings,
 actor_id uuid REFERENCES admin_users, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
