-- ══════════════════════════════════════════════════════════════════
-- EventVMS — Influencer Marketplace Migration
-- Date: 2026-04-11
-- ══════════════════════════════════════════════════════════════════

-- 1. INFLUENCER PROFILES (extends worker_profiles concept)
CREATE TABLE IF NOT EXISTS influencer_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            uuid REFERENCES organizations(id),

  -- Identity
  display_name      text NOT NULL,
  display_name_ar   text,
  bio               text,
  bio_ar            text,
  avatar_url        text,
  cover_url         text,

  -- Platform metrics
  instagram_handle  text,
  instagram_followers int DEFAULT 0,
  tiktok_handle     text,
  tiktok_followers  int DEFAULT 0,
  snapchat_handle   text,
  snapchat_followers int DEFAULT 0,
  youtube_handle    text,
  youtube_followers int DEFAULT 0,
  twitter_handle    text,
  twitter_followers int DEFAULT 0,

  -- Specializations (array of: حفلات, مؤتمرات, معارض, رياضة, ترفيه, رحلات, تعليم)
  specializations   text[] DEFAULT '{}',

  -- Content types offered (array of: ريلز, ستوري, فيديو_طويل, منشور, بث_مباشر)
  content_types     text[] DEFAULT '{}',

  -- Pricing packages
  price_basic       numeric(10,2),  -- basic package price
  price_standard    numeric(10,2),  -- standard package
  price_premium     numeric(10,2),  -- premium package
  price_description text,           -- custom pricing notes

  -- Portfolio (array of URLs/links)
  portfolio_links   text[] DEFAULT '{}',

  -- Status
  status            text DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  is_verified       boolean DEFAULT false,
  is_featured       boolean DEFAULT false,

  -- Stats (denormalized for performance)
  total_campaigns   int DEFAULT 0,
  avg_rating        numeric(3,2) DEFAULT 0,
  total_reviews     int DEFAULT 0,
  total_earnings    numeric(12,2) DEFAULT 0,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 2. CAMPAIGN BRIEFS (organizer posts a job)
CREATE TABLE IF NOT EXISTS campaign_briefs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_id          uuid REFERENCES events(id),
  created_by        uuid REFERENCES auth.users(id),

  -- Brief details
  title             text NOT NULL,
  title_ar          text,
  description       text NOT NULL,
  description_ar    text,

  -- Requirements
  event_date        date,
  event_location    text,
  event_type        text, -- حفلة, مؤتمر, معرض, رياضة, etc.
  content_types_needed text[] DEFAULT '{}', -- ريلز, ستوري, etc.

  -- Budget
  budget_min        numeric(10,2),
  budget_max        numeric(10,2),
  influencers_needed int DEFAULT 1 CHECK (influencers_needed BETWEEN 1 AND 10),

  -- Targeting
  required_platforms text[] DEFAULT '{}',
  min_followers     int DEFAULT 0,
  specializations_needed text[] DEFAULT '{}',

  -- Status
  status            text DEFAULT 'open' CHECK (status IN ('open','in_review','closed','cancelled')),
  proposals_count   int DEFAULT 0,
  selected_count    int DEFAULT 0,

  -- Deadline for proposals
  proposal_deadline timestamptz,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 3. PROPOSALS (influencer bids on a brief)
CREATE TABLE IF NOT EXISTS campaign_proposals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id          uuid REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  influencer_id     uuid REFERENCES influencer_profiles(id) ON DELETE CASCADE,

  -- Proposal details
  message           text NOT NULL,
  proposed_price    numeric(10,2) NOT NULL,
  proposed_deliverables text, -- what exactly they will deliver
  estimated_days    int DEFAULT 3,
  portfolio_samples text[] DEFAULT '{}', -- specific samples for this brief

  -- Status
  status            text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  rejection_reason  text,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(brief_id, influencer_id)
);

-- 4. CONTRACTS (accepted proposals → active contract)
CREATE TABLE IF NOT EXISTS campaign_contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id          uuid REFERENCES campaign_briefs(id),
  proposal_id       uuid REFERENCES campaign_proposals(id),
  influencer_id     uuid REFERENCES influencer_profiles(id),
  org_id            uuid REFERENCES organizations(id),

  -- Financial
  agreed_price      numeric(10,2) NOT NULL,
  platform_fee      numeric(10,2) NOT NULL, -- 15% of agreed_price
  influencer_payout numeric(10,2) NOT NULL, -- agreed_price - platform_fee

  -- Status
  status            text DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','active','content_submitted','approved','disputed','completed','cancelled'
  )),

  -- Dates
  start_date        date,
  due_date          date,
  completed_at      timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 5. ESCROW TRANSACTIONS
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       uuid REFERENCES campaign_contracts(id),
  org_id            uuid REFERENCES organizations(id),
  influencer_id     uuid REFERENCES influencer_profiles(id),

  amount            numeric(10,2) NOT NULL,
  platform_fee      numeric(10,2) NOT NULL,
  influencer_payout numeric(10,2) NOT NULL,

  -- Payment tracking
  payment_method    text, -- moyasar, stripe, bank_transfer
  payment_ref       text, -- external payment reference
  payment_status    text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','released','refunded','disputed')),

  -- Release
  released_at       timestamptz,
  released_by       uuid REFERENCES auth.users(id),
  auto_release_at   timestamptz, -- auto release after 7 days of content_submitted

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 6. CONTENT DELIVERABLES (influencer submits proof)
CREATE TABLE IF NOT EXISTS content_deliverables (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       uuid REFERENCES campaign_contracts(id),
  influencer_id     uuid REFERENCES influencer_profiles(id),

  -- Submission
  content_type      text NOT NULL, -- ريلز, ستوري, فيديو, منشور
  platform          text NOT NULL, -- tiktok, instagram, snapchat, youtube
  content_url       text NOT NULL, -- link to post
  screenshot_url    text,          -- screenshot proof
  description       text,

  -- Stats at time of submission
  views_count       int,
  likes_count       int,
  comments_count    int,
  shares_count      int,

  -- Status
  status            text DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  rejection_reason  text,
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES auth.users(id),

  created_at        timestamptz DEFAULT now()
);

-- 7. REVIEWS (post-campaign ratings)
CREATE TABLE IF NOT EXISTS campaign_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       uuid REFERENCES campaign_contracts(id),
  reviewer_id       uuid REFERENCES auth.users(id),
  reviewee_type     text CHECK (reviewee_type IN ('influencer','organizer')),
  reviewee_id       uuid, -- influencer_profile id or org id

  rating            int CHECK (rating BETWEEN 1 AND 5),
  review_text       text,
  is_public         boolean DEFAULT true,

  created_at        timestamptz DEFAULT now(),
  UNIQUE(contract_id, reviewer_id, reviewee_type)
);

-- 8. INFLUENCER MESSAGES (chat tied to brief/contract)
CREATE TABLE IF NOT EXISTS influencer_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id          uuid REFERENCES campaign_briefs(id),
  contract_id       uuid REFERENCES campaign_contracts(id),
  sender_id         uuid REFERENCES auth.users(id),
  sender_type       text CHECK (sender_type IN ('organizer','influencer')),
  message           text NOT NULL,
  attachment_url    text,
  is_read           boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_status ON influencer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user ON influencer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_org ON campaign_briefs(org_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_status ON campaign_briefs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_proposals_brief ON campaign_proposals(brief_id);
CREATE INDEX IF NOT EXISTS idx_campaign_proposals_influencer ON campaign_proposals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contracts_org ON campaign_contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contracts_influencer ON campaign_contracts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contract ON escrow_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_contract ON content_deliverables(contract_id);

-- ── RLS ENABLE ────────────────────────────────────────────────────
ALTER TABLE influencer_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_briefs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_proposals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deliverables  ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_messages   ENABLE ROW LEVEL SECURITY;

-- ── RLS POLICIES ──────────────────────────────────────────────────

-- influencer_profiles: public read for active, own write
CREATE POLICY "influencers_public_read" ON influencer_profiles
  FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "influencers_own_write" ON influencer_profiles
  FOR ALL USING (user_id = auth.uid());

-- campaign_briefs: org owner can manage, influencers can read open ones
CREATE POLICY "briefs_org_manage" ON campaign_briefs
  FOR ALL USING (org_id IN (SELECT get_my_org_ids(auth.uid())));
CREATE POLICY "briefs_influencer_read" ON campaign_briefs
  FOR SELECT USING (status = 'open' AND auth.uid() IS NOT NULL);

-- campaign_proposals: influencer owns their proposals, org can read on their briefs
CREATE POLICY "proposals_influencer_own" ON campaign_proposals
  FOR ALL USING (
    influencer_id IN (SELECT id FROM influencer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "proposals_org_read" ON campaign_proposals
  FOR SELECT USING (
    brief_id IN (SELECT id FROM campaign_briefs WHERE org_id IN (SELECT get_my_org_ids(auth.uid())))
  );

-- campaign_contracts: org and influencer can see their own
CREATE POLICY "contracts_org_read" ON campaign_contracts
  FOR SELECT USING (org_id IN (SELECT get_my_org_ids(auth.uid())));
CREATE POLICY "contracts_influencer_read" ON campaign_contracts
  FOR SELECT USING (
    influencer_id IN (SELECT id FROM influencer_profiles WHERE user_id = auth.uid())
  );

-- escrow: org and influencer see their own
CREATE POLICY "escrow_org_read" ON escrow_transactions
  FOR SELECT USING (org_id IN (SELECT get_my_org_ids(auth.uid())));
CREATE POLICY "escrow_influencer_read" ON escrow_transactions
  FOR SELECT USING (
    influencer_id IN (SELECT id FROM influencer_profiles WHERE user_id = auth.uid())
  );

-- deliverables: influencer writes, org reads
CREATE POLICY "deliverables_influencer_write" ON content_deliverables
  FOR ALL USING (
    influencer_id IN (SELECT id FROM influencer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "deliverables_org_read" ON content_deliverables
  FOR SELECT USING (
    contract_id IN (SELECT id FROM campaign_contracts WHERE org_id IN (SELECT get_my_org_ids(auth.uid())))
  );

-- reviews: users write their own, public read
CREATE POLICY "reviews_own_write" ON campaign_reviews
  FOR ALL USING (reviewer_id = auth.uid());
CREATE POLICY "reviews_public_read" ON campaign_reviews
  FOR SELECT USING (is_public = true);

-- messages: participants can read/write
CREATE POLICY "messages_participants" ON influencer_messages
  FOR ALL USING (sender_id = auth.uid() OR auth.uid() IS NOT NULL);

-- ── AUTO-UPDATE TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_influencer_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE influencer_profiles SET
    total_campaigns = (
      SELECT COUNT(*) FROM campaign_contracts
      WHERE influencer_id = NEW.influencer_id AND status = 'completed'
    ),
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM campaign_reviews
      WHERE reviewee_id = NEW.influencer_id AND reviewee_type = 'influencer'
    ),
    total_reviews = (
      SELECT COUNT(*) FROM campaign_reviews
      WHERE reviewee_id = NEW.influencer_id AND reviewee_type = 'influencer'
    ),
    updated_at = now()
  WHERE id = NEW.influencer_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_contract_complete
  AFTER UPDATE ON campaign_contracts
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_influencer_stats();

-- ── SAMPLE INFLUENCER DATA ────────────────────────────────────────
INSERT INTO influencer_profiles (
  display_name, display_name_ar, bio, bio_ar,
  tiktok_handle, tiktok_followers,
  instagram_handle, instagram_followers,
  snapchat_handle, snapchat_followers,
  youtube_handle, youtube_followers,
  specializations, content_types,
  price_basic, price_standard, price_premium,
  status, is_verified, is_featured, user_id
) VALUES
(
  'Sarah Al-Ghamdi', 'سارة الغامدي',
  'Event content creator specializing in concerts and entertainment',
  'صانعة محتوى متخصصة في الفعاليات الترفيهية والحفلات',
  'sarah.events', 450000,
  'sarah.alghamdi', 280000,
  'sarah.snap', 190000,
  NULL, 0,
  ARRAY['ترفيه','حفلات','فعاليات'],
  ARRAY['ريلز','ستوري','منشور'],
  1500, 3500, 7000,
  'active', true, true,
  '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'
),
(
  'Mohammed Al-Shehri', 'محمد الشهري',
  'Sports events influencer and content creator',
  'مؤثر في الفعاليات الرياضية وصانع محتوى',
  'moh.sports', 890000,
  'mohshehri', 340000,
  'moh.shehri', 210000,
  'mohshehri_yt', 125000,
  ARRAY['رياضة','فعاليات','مؤتمرات'],
  ARRAY['فيديو_طويل','ريلز','بث_مباشر'],
  2000, 5000, 10000,
  'active', true, false,
  '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'
),
(
  'Lina Rashid', 'لينا راشد',
  'Business conferences and corporate events specialist',
  'متخصصة في فعاليات الأعمال والمؤتمرات المؤسسية',
  'lina.biz', 220000,
  'lina.rashid', 180000,
  NULL, 0,
  'linarashid', 45000,
  ARRAY['مؤتمرات','معارض','أعمال'],
  ARRAY['منشور','ريلز','فيديو_طويل'],
  1200, 2800, 5500,
  'active', false, false,
  '6ab63c7f-a3b9-4830-a695-3a97d9c8ed7e'
);

-- Verify
SELECT
  'influencer_profiles' as tbl, COUNT(*) as rows FROM influencer_profiles
UNION ALL SELECT 'campaign_briefs', COUNT(*) FROM campaign_briefs
UNION ALL SELECT 'campaign_proposals', COUNT(*) FROM campaign_proposals
UNION ALL SELECT 'campaign_contracts', COUNT(*) FROM campaign_contracts
UNION ALL SELECT 'escrow_transactions', COUNT(*) FROM escrow_transactions;
