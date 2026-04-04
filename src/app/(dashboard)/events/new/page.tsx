'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventService } from '@/services/EventService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const ticketTypeSchema = z.object({
  label: z.string().min(1, 'Ticket label is required'),
  price: z.number().min(0, 'Price must be at least 0'),
});

const eventSchema = z.object({
  title: z.string().min(3, 'Event title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(3, 'Venue is required'),
  maxAttendees: z.number().min(1, 'Capacity must be at least 1'),
  ticketTypes: z.array(ticketTypeSchema).min(1, 'Add at least one ticket type'),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      location: '',
      maxAttendees: 50,
      ticketTypes: [
        { label: 'VIP', price: 0 },
        { label: 'Regular', price: 0 },
        { label: 'Group', price: 0 },
      ],
    },
  });

  useEffect(() => {
    form.register('ticketTypes.0.label');
    form.register('ticketTypes.1.label');
    form.register('ticketTypes.2.label');
    form.register('ticketTypes.0.price', { valueAsNumber: true });
    form.register('ticketTypes.1.price', { valueAsNumber: true });
    form.register('ticketTypes.2.price', { valueAsNumber: true });
  }, [form]);

  const onSubmit = async (values: EventFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setError('You must be signed in to create an event.');
        setLoading(false);
        return;
      }

      const eventService = new EventService();
      const event = await eventService.create({
        account_id: user.id,
        organizerId: user.id,
        title: values.title,
        description: values.description,
        date: values.date,
        location: values.location,
        maxAttendees: values.maxAttendees,
        ticketTypes: values.ticketTypes,
      });

      router.push(`/dashboard/events/${event.id}`);
    } catch (err: any) {
      setError(err?.message || 'Unable to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create new event</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <div className="text-lg font-semibold">Ticket types</div>
                {form.getValues('ticketTypes').map((ticket, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`ticketTypes.${index}.label` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ticketTypes.${index}.price` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? 0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving event...' : 'Create event'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}