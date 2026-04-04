'use client';

import { useEffect, useState } from 'react';
import { PlanService } from '@/services/PlanService';
import { SubscriptionPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Edit, Plus } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [accountCounts, setAccountCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const service = new PlanService();
        const plansData = await service.getAllPlans();
        setPlans(plansData);

        // Load account counts for each plan
        const counts: Record<string, number> = {};
        for (const plan of plansData) {
          counts[plan.id] = await service.getAccountCountForPlan(plan.id);
        }
        setAccountCounts(counts);
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleToggleFeatured = async (plan: SubscriptionPlan) => {
    try {
      const service = new PlanService();
      const updatedPlan = await service.upsertPlan({
        ...plan,
        is_featured: !plan.is_featured,
      });
      setPlans(plans.map(p => (p.id === plan.id ? updatedPlan : p)));
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const service = new PlanService();
      const updatedPlan = await service.upsertPlan({
        ...plan,
        is_active: !plan.is_active,
      });
      setPlans(plans.map(p => (p.id === plan.id ? updatedPlan : p)));
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الخطط</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedPlan(null)}>
              <Plus className="mr-2 h-4 w-4" />
              خطة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <PlanForm plan={null} onSave={(plan) => setPlans([...plans, plan])} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الخطط</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>السعر (شهري)</TableHead>
                <TableHead>السعر (سنوي)</TableHead>
                <TableHead>الأحداث</TableHead>
                <TableHead>المسجلين / حدث</TableHead>
                <TableHead>عدد الحسابات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.price_monthly ? `${plan.price_monthly} SAR` : 'اتصل بنا'}</TableCell>
                  <TableCell>{plan.price_yearly ? `${plan.price_yearly} SAR` : '-'}</TableCell>
                  <TableCell>{plan.max_events || 'غير محدود'}</TableCell>
                  <TableCell>{plan.max_attendees_per_event || 'غير محدود'}</TableCell>
                  <TableCell>{accountCounts[plan.id] || 0}</TableCell>
                  <TableCell className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <PlanForm
                          plan={plan}
                          onSave={(updated) => setPlans(plans.map(p => (p.id === plan.id ? updated : p)))}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant={plan.is_active ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleActive(plan)}
                    >
                      {plan.is_active ? 'مفعل' : 'معطل'}
                    </Button>
                    {plan.is_featured && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        مميز
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanForm({ plan, onSave }: { plan: SubscriptionPlan | null; onSave: (plan: SubscriptionPlan) => void }) {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(
    plan || {
      name: '',
      name_en: '',
      slug: '',
      price_monthly: 0,
      price_yearly: 0,
      max_events: null,
      max_attendees_per_event: null,
      max_sms: 0,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const service = new PlanService();
      const saved = await service.upsertPlan(formData);
      onSave(saved);
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{plan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}</DialogTitle>
      </DialogHeader>
      <div>
        <label className="block text-sm font-medium mb-1">الاسم (عربي)</label>
        <Input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">الاسم (إنجليزي)</label>
        <Input
          value={formData.name_en || ''}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">السعر الشهري</label>
        <Input
          type="number"
          value={formData.price_monthly || 0}
          onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || null })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">السعر السنوي</label>
        <Input
          type="number"
          value={formData.price_yearly || 0}
          onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || null })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">أقصى أحداث</label>
        <Input
          type="number"
          value={formData.max_events === null ? '' : formData.max_events}
          onChange={(e) => setFormData({ ...formData, max_events: e.target.value ? parseInt(e.target.value, 10) : null })}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'جاري الحفظ...' : 'حفظ'}
      </Button>
    </form>
  );
}
