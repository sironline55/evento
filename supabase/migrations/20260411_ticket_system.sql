-- Add attendee info columns to registrations if not exist
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS attendee_name text,
  ADD COLUMN IF NOT EXISTS attendee_email text,
  ADD COLUMN IF NOT EXISTS attendee_phone text;

-- Get an event to use
DO $$
DECLARE
  v_event_id uuid;
  v_org_id uuid;
BEGIN
  SELECT id, org_id INTO v_event_id, v_org_id FROM events LIMIT 1;
  
  IF v_event_id IS NOT NULL THEN
    -- Insert test registrations with proper attendee info
    INSERT INTO registrations (event_id, qr_code, status, attendee_name, attendee_email, created_by)
    VALUES
      (v_event_id, 'EVT-TICKET001', 'confirmed', 'محمد الأحمد', 'mohammed@example.com', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'),
      (v_event_id, 'EVT-TICKET002', 'confirmed', 'سارة العمري', 'sara@example.com', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'),
      (v_event_id, 'EVT-TICKET003', 'checked_in', 'خالد المطيري', 'khalid@example.com', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e')
    ON CONFLICT (qr_code) DO UPDATE SET
      attendee_name = EXCLUDED.attendee_name,
      attendee_email = EXCLUDED.attendee_email;
    
    RAISE NOTICE 'Inserted registrations for event %', v_event_id;
  ELSE
    RAISE NOTICE 'No events found — inserting an event first';
    INSERT INTO events (name, start_date, location, status, created_by)
    VALUES ('مؤتمر ريادة الأعمال 2026', '2026-05-15 09:00:00+03', 'الرياض — فندق الريتز كارلتون', 'published', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e')
    RETURNING id INTO v_event_id;
    
    INSERT INTO registrations (event_id, qr_code, status, attendee_name, attendee_email, created_by)
    VALUES
      (v_event_id, 'EVT-TICKET001', 'confirmed', 'محمد الأحمد', 'mohammed@example.com', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'),
      (v_event_id, 'EVT-TICKET002', 'confirmed', 'سارة العمري', 'sara@example.com', '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verify
SELECT r.qr_code, r.attendee_name, r.attendee_email, r.status, e.name as event_name
FROM registrations r
LEFT JOIN events e ON e.id = r.event_id
WHERE r.qr_code LIKE 'EVT-TICKET%'
ORDER BY r.created_at;
