'use client';

import { useEffect, useState } from 'react';
import { PlanService } from '@/services/PlanService';
import { SubscriptionPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check,
  X,
} from 'lucide-react';

interface PricingCardsProps {
  onSelectPlan?: (planId: string) => void;
}

/**
 * [AR] مكون عرض بطاقات الأسعار
 * [EN] Pricing cards component for displaying subscription plans
 */
export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const service = new PlanService();
        const plansData = await service.getAllPlans();
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  const getButtonText = (plan: SubscriptionPlan) => {
    if (plan.slug === 'free') return 'ابدأ مجاناً';
    if (plan.slug === 'enterprise') return 'تواصل معنا';
    return 'اشترك الآن';
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'monthly') {
      return plan.price_monthly;
    }
    return plan.price_yearly;
  };

  return (
    <div className="w-full">
      {/* Billing period toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-2">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded transition ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الفواتير الشهرية
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded transition ${
              billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الفواتير السنوية
          </button>
        </div>
      </div>

      {/* Pricing cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const isFeatured = plan.is_featured;

          return (
            <Card
              key={plan.id}
              className={`relative transition ${
                isFeatured
                  ? 'border-2 shadow-lg scale-105'
                  : 'border'
              }`}
              style={isFeatured ? { borderColor: '#2B6E64' } : {}}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#2B6E64] text-white px-3 py-1 rounded-full text-xs font-medium">
                    الأكثر رواجاً
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  {price !== null ? (
                    <div>
                      <span className="text-3xl font-bold">{price.toLocaleString('ar-SA')}</span>
                      <span className="text-gray-600 mr-2">SAR</span>
                      <span className="text-sm text-gray-600">
                        /{billingPeriod === 'monthly' ? 'شهر' : 'سنة'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">تسعير مخصص</div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features highlight */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.max_attendees_per_event || 'غير محدود'} مسجل/حدث
                  </p>
                </div>

                {/* Features list */}
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    {plan.max_events !== null ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{plan.max_events || 'غير محدود'} أحداث</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.badge_printing ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>طباعة الشارات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.zones_management ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>إدارة المناطق</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.excel_import ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>استيراد Excel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.google_forms_import ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>استيراد Google Forms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.api_access ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>وصول API</span>
                  </li>
                  <li className="flex items-start gap-3">
                    {plan.white_label ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span>تسمية بيضاء</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full rounded-full"
                  style={
                    plan.slug === 'enterprise'
                      ? {}
                      : { backgroundColor: '#2B6E64' }
                  }
                  onClick={() => onSelectPlan?.(plan.id)}
                >
                  {getButtonText(plan)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
