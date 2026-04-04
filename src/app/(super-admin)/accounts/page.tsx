'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlanService } from '@/services/PlanService';
import { SubscriptionPlan, AccountSubscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AccountWithSubscription {
  id: string;
  email: string;
  name?: string;
  subscription?: AccountSubscription & { plan?: SubscriptionPlan };
  event_count?: number;
  attendee_count?: number;
  created_at?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all plans for filter
        const planService = new PlanService();
        const plansData = await planService.getAllPlans();
        setPlans(plansData);

        // Get all accounts with subscriptions
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*');

        if (accountsError) throw accountsError;

        // Enrich with subscription data
        const accountsWithSubscriptions: AccountWithSubscription[] = [];
        for (const account of accountsData || []) {
          const { data: subscription } = await supabase
            .from('account_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('account_id', account.id)
            .eq('status', 'active')
            .single();

          // Get event and attendee counts
          const { data: events } = await supabase
            .from('events')
            .select('id', { count: 'exact' })
            .eq('account_id', account.id);

          const { data: attendees } = await supabase
            .from('attendees')
            .select('id', { count: 'exact' })
            .in('eventId', (events || []).map(e => e.id));

          accountsWithSubscriptions.push({
            ...account,
            subscription,
            event_count: events?.length || 0,
            attendee_count: attendees?.length || 0,
          });
        }

        setAccounts(accountsWithSubscriptions);
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChangePlan = async (accountId: string, newPlanId: string) => {
    try {
      const planService = new PlanService();
      await planService.upgradePlan(accountId, newPlanId);
      
      // Reload accounts
      window.location.reload();
    } catch (error) {
      console.error('Error changing plan:', error);
    }
  };

  const filteredAccounts = selectedPlanFilter === 'all'
    ? accounts
    : accounts.filter(acc => acc.subscription?.plan_id === selectedPlanFilter);

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">إدارة الحسابات</h1>
        <div className="flex gap-4">
          <Select value={selectedPlanFilter} onValueChange={setSelectedPlanFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="فلترة حسب الخطة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الخطط</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الحسابات ({filteredAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الخطة الحالية</TableHead>
                  <TableHead>الأحداث</TableHead>
                  <TableHead>المسجلين</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.name || '-'}</TableCell>
                    <TableCell className="font-medium">{account.subscription?.plan?.name || 'بدون خطة'}</TableCell>
                    <TableCell>{account.event_count || 0}</TableCell>
                    <TableCell>{account.attendee_count || 0}</TableCell>
                    <TableCell>{new Date(account.created_at || '').toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            تغيير الخطة
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تغيير خطة الحساب</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-4">الخطة الحالية: {account.subscription?.plan?.name}</p>
                              <Select
                                defaultValue={account.subscription?.plan_id}
                                onValueChange={(newPlanId) => handleChangePlan(account.id, newPlanId)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر خطة جديدة" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
