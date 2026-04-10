-- =============================================
-- EventVMS: QR Auto-Generation + Test Data
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1) AUTO QR CODE TRIGGER
-- Generates a unique QR code for every new registration
-- Format: EVT-XXXXXXXX (8 uppercase hex chars)
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'EVT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
  END IF;
  IF NEW.ticket_reference IS NULL OR NEW.ticket_reference = '' THEN
    NEW.ticket_reference := UPPER(SUBSTRING(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_qr ON registrations;
CREATE TRIGGER trg_auto_qr
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code();

-- 2) TEST REGISTRATIONS
-- Insert 6 test attendees for the two existing events
-- Event 1: فعالية تجريبية (0b1b1a79-...)
-- Event 2: مؤتمر ريادة الأعمال (the second event)

-- Get event IDs first
DO $$
DECLARE
  ev1 UUID;
  ev2 UUID;
  sam_id UUID := '3b93f782-dcb1-4f0a-95b7-b70147b833e1';
BEGIN
  SELECT id INTO ev1 FROM events ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO ev2 FROM events ORDER BY created_at DESC LIMIT 1;

  -- Event 1 registrations
  INSERT INTO registrations (event_id, guest_name, guest_email, ticket_type, status, qr_code, ticket_reference, created_by)
  VALUES
    (ev1, 'أحمد محمد الزهراني',  'ahmed@test.com',   'عامة',   'registered', 'EVT-TEST001', 'TEST001', sam_id),
    (ev1, 'سارة عبدالله السعيد', 'sara@test.com',    'VIP',    'registered', 'EVT-TEST002', 'TEST002', sam_id),
    (ev1, 'محمد خالد العتيبي',   'khalid@test.com',  'عامة',   'registered', 'EVT-TEST003', 'TEST003', sam_id),
    (ev1, 'نورة فيصل الدوسري',   'noura@test.com',   'طالب',   'attended',   'EVT-TEST004', 'TEST004', sam_id)
  ON CONFLICT DO NOTHING;

  -- Event 2 registrations (only if ev2 != ev1)
  IF ev1 <> ev2 THEN
    INSERT INTO registrations (event_id, guest_name, guest_email, ticket_type, status, qr_code, ticket_reference, created_by)
    VALUES
      (ev2, 'عمر سلطان المطيري',   'omar@test.com',    'عامة',   'registered', 'EVT-TEST005', 'TEST005', sam_id),
      (ev2, 'ريم ناصر القحطاني',   'reem@test.com',    'VIP',    'registered', 'EVT-TEST006', 'TEST006', sam_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3) VERIFY
SELECT
  r.qr_code,
  r.ticket_reference,
  r.guest_name,
  r.ticket_type,
  r.status,
  e.title AS event_title
FROM registrations r
JOIN events e ON e.id = r.event_id
ORDER BY r.created_at;
