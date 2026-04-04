-- Subscription Plans Table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  currency TEXT DEFAULT 'SAR',
  max_events INTEGER,
  max_attendees_per_event INTEGER,
  max_total_attendees INTEGER,
  max_team_members INTEGER NOT NULL,
  max_sms INTEGER DEFAULT 0,
  max_import_rows INTEGER,
  badge_printing BOOLEAN DEFAULT FALSE,
  parking_management BOOLEAN DEFAULT FALSE,
  zones_management BOOLEAN DEFAULT FALSE,
  excel_import BOOLEAN DEFAULT FALSE,
  google_forms_import BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE,
  custom_domain BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account Subscriptions Table
CREATE TABLE account_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id)
);

-- Insert Default Plans
INSERT INTO subscription_plans (
  name, name_en, slug, price_monthly, price_yearly, max_events, 
  max_attendees_per_event, max_total_attendees, max_team_members, 
  max_sms, max_import_rows, is_active, sort_order
) VALUES 
(
  'مجاني',
  'Free',
  'free',
  0,
  0,
  1,
  50,
  50,
  1,
  0,
  NULL,
  TRUE,
  1
),
(
  'ذهبي',
  'Gold',
  'gold',
  149,
  1490,
  5,
  200,
  500,
  3,
  500,
  1000,
  TRUE,
  2
),
(
  'بلاتيني',
  'Platinum',
  'platinum',
  399,
  3990,
  20,
  1000,
  5000,
  10,
  5000,
  10000,
  TRUE,
  3
),
(
  'مؤسسي',
  'Enterprise',
  'enterprise',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  TRUE,
  4
);

-- Update platinum and enterprise features
UPDATE subscription_plans SET
  badge_printing = TRUE,
  zones_management = TRUE,
  excel_import = TRUE,
  is_featured = (slug = 'gold')
WHERE slug IN ('platinum', 'gold');

UPDATE subscription_plans SET
  badge_printing = TRUE,
  parking_management = TRUE,
  zones_management = TRUE,
  excel_import = TRUE,
  google_forms_import = TRUE,
  api_access = TRUE,
  white_label = TRUE,
  custom_domain = TRUE,
  priority_support = TRUE
WHERE slug = 'platinum';

UPDATE subscription_plans SET
  badge_printing = TRUE,
  parking_management = TRUE,
  zones_management = TRUE,
  excel_import = TRUE,
  google_forms_import = TRUE,
  api_access = TRUE,
  white_label = TRUE,
  custom_domain = TRUE,
  priority_support = TRUE
WHERE slug = 'enterprise';
