'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

const smsSchema = z.object({
  provider: z.enum(['unifonic', 'msegat']),
  apiKey: z.string().min(1, 'API Key is required'),
  senderId: z.string().min(1, 'Sender ID is required'),
});

const paymentSchema = z.object({
  provider: z.enum(['moyasar', 'paytabs', 'stripe']),
  apiKey: z.string().min(1, 'API Key is required'),
  secretKey: z.string().min(1, 'Secret Key is required'),
});

const printerSchema = z.object({
  printerType: z.string().min(1, 'Printer type is required'),
  ipAddress: z.string().min(1, 'IP Address is required'),
  port: z.string().min(1, 'Port is required'),
});

type SmsForm = z.infer<typeof smsSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;
type PrinterForm = z.infer<typeof printerSchema>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  ]);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: '' });

  const smsForm = useForm<SmsForm>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      provider: 'unifonic',
      apiKey: '',
      senderId: '',
    },
  });

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      provider: 'moyasar',
      apiKey: '',
      secretKey: '',
    },
  });

  const printerForm = useForm<PrinterForm>({
    resolver: zodResolver(printerSchema),
    defaultValues: {
      printerType: '',
      ipAddress: '',
      port: '',
    },
  });

  const onSmsSubmit = (data: SmsForm) => {
    console.log('SMS Settings:', data);
    // Save to backend
  };

  const onPaymentSubmit = (data: PaymentForm) => {
    console.log('Payment Settings:', data);
    // Save to backend
  };

  const onPrinterSubmit = (data: PrinterForm) => {
    console.log('Printer Settings:', data);
    // Save to backend
  };

  const addTeamMember = () => {
    if (newMember.name && newMember.email && newMember.role) {
      setTeamMembers([...teamMembers, { ...newMember, id: Date.now().toString() }]);
      setNewMember({ name: '', email: '', role: '' });
    }
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SMS Provider Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...smsForm}>
              <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} className="space-y-4">
                <FormField
                  control={smsForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unifonic">Unifonic</SelectItem>
                          <SelectItem value="msegat">Msegat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={smsForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={smsForm.control}
                  name="senderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Save SMS Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="moyasar">Moyasar</SelectItem>
                          <SelectItem value="paytabs">PayTabs</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Save Payment Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge Printer Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...printerForm}>
              <form onSubmit={printerForm.handleSubmit(onPrinterSubmit)} className="space-y-4">
                <FormField
                  control={printerForm.control}
                  name="printerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printer Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Zebra ZC300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={printerForm.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="192.168.1.100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={printerForm.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="9100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Save Printer Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
                <Input
                  placeholder="Role"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                />
              </div>
              <Button onClick={addTeamMember}>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}