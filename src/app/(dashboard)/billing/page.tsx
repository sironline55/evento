'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlanService } from '@/services/PlanService';
import { PlanUsageStats, SubscriptionPlan, AccountSubscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PricingCards } from '@/components/billing/PricingCards';
import { Check } from 'lucide-react';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<AccountSubscription | null>(null);
  const [stats, setStats] = useState<PlanUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) {
          setLoading(false);
          return;
        }

        setAccountId(user.id);

        const planService = new PlanService();
        const subData = await planService.getPlanForAccount(user.id);
        setSubscription(subData);

        if (subData) {
          const statsData = await planService.getUsageStats(user.id);
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!subscription || !stats) {
    return <div className="flex justify-center items-center h-64">لم يتم العثور على خطة</div>;
  }

  const plan = stats.plan;
  const getProgressPercentage = (current: number, max: number | null) => {
    if (max === null) return 0;
    return Math.round((current / max) * 100);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الفواتيس والاشتراك</h1>
        <p className="text-gray-600 mt-2">أدر خطتك ومراجعة الاستخدام</p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-2" style={{ borderColor: '#2B6E64' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                الفترة الحالية: من {new Date(subscription.current_period_start).toLocaleDateString('ar-SA')} إلى{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: '#2B6E64' }} className="rounded-full">
                  ترقية الخطة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <PricingCards onSelectPlan={() => window.location.reload()} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.price_monthly && (
              <div>
                <p className="text-sm text-gray-600">السعر الشهري</p>
                <p className="text-2xl font-bold">{plan.price_monthly.toLocaleString('ar-SA')} SAR</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">الحالة</p>
              <p className="text-lg font-semibold text-green-600 capitalize">
                {subscription.status === 'active' ? 'نشط' : subscription.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">إحصائيات الاستخدام</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الأحداث</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">
                {stats.current_events} / {plan.max_events || 'غير محدود'}
              </div>
              {plan.max_events && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#2B6E64] h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(stats.current_events, plan.max_events)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {getProgressPercentage(stats.current_events, plan.max_events)}% مستخدم
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">المسجلين هذا الشهر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">
                {stats.current_attendees} / {plan.max_total_attendees || 'غير محدود'}
              </div>
              {plan.max_total_attendees && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#2B6E64] h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(stats.current_attendees, plan.max_total_attendees)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {getProgressPercentage(stats.current_attendees, plan.max_total_attendees)}% مستخدم
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">رسائل SMS المرسلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">
                {stats.current_sms} / {plan.max_sms || 'غير محدود'}
              </div>
              {plan.max_sms && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#2B6E64] h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(stats.current_sms, plan.max_sms)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {getProgressPercentage(stats.current_sms, plan.max_sms)}% مستخدم
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>الميزات المتضمنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.badge_printing && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>طباعة الشارات</span>
              </div>
            )}
            {plan.zones_management && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>إدارة المناطق</span>
              </div>
            )}
            {plan.excel_import && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>استيراد Excel</span>
              </div>
            )}
            {plan.google_forms_import && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>استيراد Google Forms</span>
              </div>
            )}
            {plan.api_access && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>وصول API</span>
              </div>
            )}
            {plan.white_label && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>تسمية بيضاء</span>
              </div>
            )}
            {plan.priority_support && (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span>الدعم ذو الأولوية</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
