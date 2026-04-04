import { BaseService } from './BaseService';
import { SubscriptionPlan, AccountSubscription, PlanUsageStats, AttendeeLimit } from '../types';

/**
 * [AR] خدمة إدارة الخطط والاشتراكات
 * [EN] Subscription Plans Service - manages pricing tiers and usage limits
 */
export class PlanService extends BaseService {
  /**
   * [AR] الحصول على جميع الخطط المفعلة
   * [EN] Get all active subscription plans ordered by sort_order
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * [AR] الحصول على خطة حساب معين
   * [EN] Get the active subscription plan for a specific account
   */
  async getPlanForAccount(accountId: string): Promise<AccountSubscription | null> {
    const { data, error } = await this.supabase
      .from('account_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * [AR] التحقق من حد المسجلين في الحدث
   * [EN] Check if account has reached attendee limit for an event
   * @returns allowed: whether more attendees can be added, current: current count, max: plan limit
   */
  async checkAttendeeLimit(accountId: string, eventId: string): Promise<AttendeeLimit> {
    const subscription = await this.getPlanForAccount(accountId);
    
    if (!subscription?.plan) {
      return { allowed: false, current: 0, max: 0, percentage: 100 };
    }

    const plan = subscription.plan as SubscriptionPlan;

    // Get current attendees for this event
    const { data: eventAttendees, error: attendeeError } = await this.supabase
      .from('attendees')
      .select('id', { count: 'exact' })
      .eq('eventId', eventId)
      .not('status', 'eq', 'cancelled');

    if (attendeeError) throw attendeeError;
    const current = eventAttendees?.length || 0;
    const max = plan.max_attendees_per_event || Infinity;
    const allowed = current < max;
    const percentage = max === Infinity ? 0 : Math.round((current / max) * 100);

    return { allowed, current, max: max === Infinity ? null : max, percentage };
  }

  /**
   * [AR] التحقق من حد الأحداث للحساب
   * [EN] Check if account has reached event limit
   */
  async checkEventLimit(accountId: string): Promise<{ allowed: boolean; current: number; max: number | null }> {
    const subscription = await this.getPlanForAccount(accountId);
    
    if (!subscription?.plan) {
      return { allowed: false, current: 0, max: 0 };
    }

    const plan = subscription.plan as SubscriptionPlan;

    // Get current events for this account
    const { data: events, error: eventError } = await this.supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId);

    if (eventError) throw eventError;
    const current = events?.length || 0;
    const max = plan.max_events;
    const allowed = max === null || current < max;

    return { allowed, current, max };
  }

  /**
   * [AR] ترقية خطة الحساب
   * [EN] Upgrade or change account subscription plan
   */
  async upgradePlan(accountId: string, planId: string): Promise<AccountSubscription> {
    // Get plan details
    const { data: plan, error: planError } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) throw planError;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update or create subscription
    const { data: existing } = await this.supabase
      .from('account_subscriptions')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (existing) {
      const { data, error } = await this.supabase
        .from('account_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
        })
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) throw error;
      await this.logActivity(accountId, 'plan.upgrade', { planId, planName: plan.name });
      return data;
    } else {
      const { data, error } = await this.supabase
        .from('account_subscriptions')
        .insert({
          account_id: accountId,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      await this.logActivity(accountId, 'plan.create', { planId, planName: plan.name });
      return data;
    }
  }

  /**
   * [AR] الحصول على إحصائيات الاستخدام
   * [EN] Get comprehensive usage statistics for account
   */
  async getUsageStats(accountId: string): Promise<PlanUsageStats> {
    const subscription = await this.getPlanForAccount(accountId);
    
    if (!subscription?.plan) {
      throw new Error('No active subscription found');
    }

    const plan = subscription.plan as SubscriptionPlan;

    // Get event count
    const { data: events, error: eventError } = await this.supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId);

    if (eventError) throw eventError;

    // Get total attendees this period
    const { data: attendees, error: attendeeError } = await this.supabase
      .from('attendees')
      .select('id', { count: 'exact' })
      .in('eventId', (events || []).map(e => e.id))
      .gte('registeredAt', subscription.current_period_start);

    if (attendeeError) throw attendeeError;

    // SMS count would come from activity_logs or a separate table
    // For now, placeholder
    const { data: smsCounts, error: smsError } = await this.supabase
      .from('activity_logs')
      .select('id', { count: 'exact' })
      .eq('account_id', accountId)
      .eq('action', 'sms.send')
      .gte('created_at', subscription.current_period_start);

    if (smsError) throw smsError;

    await this.logActivity(accountId, 'plan.getStats', {});

    return {
      plan,
      current_events: events?.length || 0,
      current_attendees: attendees?.length || 0,
      current_sms: smsCounts?.length || 0,
      current_team_members: 1, // Would need separate table
      period_end: subscription.current_period_end,
    };
  }

  /**
   * [AR] إنشاء أو تحديث خطة (للإدارة)
   * [EN] Create or update a subscription plan (admin only)
   */
  async upsertPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    if (plan.id) {
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .update({ ...plan, updated_at: new Date().toISOString() })
        .eq('id', plan.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * [AR] الحصول على عدد الحسابات لخطة معينة
   * [EN] Get count of active accounts on a specific plan
   */
  async getAccountCountForPlan(planId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('account_subscriptions')
      .select('id', { count: 'exact' })
      .eq('plan_id', planId)
      .eq('status', 'active');

    if (error) throw error;
    return data?.length || 0;
  }
}
