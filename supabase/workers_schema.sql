
-- Workers module schema

CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id),
  attendee_id UUID REFERENCES attendees(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male','female')),
  age INTEGER,
  photo_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  daily_rate INTEGER DEFAULT 150,
  availability TEXT[] DEFAULT '{}',
  event_types TEXT[] DEFAULT '{}',
  id_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  source TEXT DEFAULT 'self_registered' CHECK (source IN ('self_registered','attendee_optin','company_upload')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','inactive','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staffing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id),
  event_id UUID REFERENCES events(id),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  duration_hours INTEGER DEFAULT 8,
  workers_needed INTEGER DEFAULT 1,
  workers_confirmed INTEGER DEFAULT 0,
  role_type TEXT NOT NULL,
  gender_preference TEXT DEFAULT 'any',
  daily_rate INTEGER NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','filled','cancelled','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  staffing_request_id UUID REFERENCES staffing_requests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  cover_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, staffing_request_id)
);

CREATE INDEX IF NOT EXISTS idx_workers_city ON worker_profiles(city);
CREATE INDEX IF NOT EXISTS idx_workers_status ON worker_profiles(status);
CREATE INDEX IF NOT EXISTS idx_workers_available ON worker_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_workers_gender ON worker_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_workers_source ON worker_profiles(source);

ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workers_public_read" ON worker_profiles;
DROP POLICY IF EXISTS "workers_insert" ON worker_profiles;
DROP POLICY IF EXISTS "requests_account" ON staffing_requests;

CREATE POLICY "workers_public_read" ON worker_profiles FOR SELECT USING (status = 'active');
CREATE POLICY "workers_insert" ON worker_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "requests_account" ON staffing_requests FOR ALL USING (account_id IN (SELECT account_id FROM users WHERE id = auth.uid()));

SELECT 'Workers schema applied' as result;
