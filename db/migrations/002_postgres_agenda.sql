-- Preserve historical Calendar identifiers for traceability, but remove them as resources.
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ALTER COLUMN google_event_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN google_calendar_id DROP NOT NULL;
ALTER TABLE booking_holds DROP CONSTRAINT booking_holds_calendar_id_tstzrange_excl;
ALTER TABLE booking_holds ALTER COLUMN calendar_id DROP NOT NULL;
INSERT INTO booking_audit(booking_id,action)
SELECT id,'MIGRATE_POSTGRES_' || status || COALESCE('_' || pending_action,'') FROM bookings;
-- Resolve durable intents within this migration. Existing holds protect both move endpoints.
UPDATE bookings SET start_at=COALESCE(target_start,start_at),end_at=COALESCE(target_end,end_at)
WHERE pending_action='MOVE';
UPDATE bookings SET status=CASE WHEN status='CANCELED' OR pending_action='CANCEL' THEN 'CANCELLED' ELSE 'CONFIRMED' END,
pending_action=NULL,target_start=NULL,target_end=NULL,sync_error=NULL,updated_at=now();
DELETE FROM booking_holds h USING bookings b WHERE b.id=h.booking_id AND b.status='CANCELLED';
UPDATE booking_holds h SET start_at=b.start_at,end_at=b.end_at,calendar_id=NULL FROM bookings b WHERE b.id=h.booking_id;
INSERT INTO booking_holds(booking_id,professional_id,start_at,end_at)
SELECT id,professional_id,start_at,end_at FROM bookings WHERE status='CONFIRMED'
ON CONFLICT(booking_id) DO NOTHING;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK(status IN ('CONFIRMED','CANCELLED','COMPLETED','NO_SHOW'));
ALTER TABLE availability_exceptions DROP CONSTRAINT availability_exceptions_kind_check;
ALTER TABLE availability_exceptions ADD CONSTRAINT availability_exceptions_kind_check CHECK(kind IN ('BLOCK','CLOSED','HOURS','EXTRA'));
