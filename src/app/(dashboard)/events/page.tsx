'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { EventService } from '@/services/EventService';
import { Event, EventStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, DollarSign, Plus } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setAccountId(user.id);
      const service = new EventService();
      const eventsData = await service.list(user.id);
      setEvents(eventsData);

      const statsData = await Promise.all(
        eventsData.map((event) => service.getStats(event.id, user.id))
      );
      setStats(statsData);
      setLoading(false);
    };

    load();
  }, []);

  const totalEvents = events.length;
  const totalAttendees = stats.reduce((sum, stat) => sum + stat.totalAttendees, 0);
  const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-600">Manage your account events and review live metrics.</p>
        </div>

        <Link href="/dashboard/events/new">
          <Button className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create new event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalAttendees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {events.map((event) => {
          const eventStats = stats.find((item) => item.eventId === event.id);
          return (
            <Card key={event.id} className="border-gray-200">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-500">{event.location}</div>
                <div className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="font-semibold">Attendees</div>
                    <div>{eventStats?.totalAttendees ?? 0}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="font-semibold">Revenue</div>
                    <div>${(eventStats?.revenue ?? 0).toFixed(2)}</div>
                  </div>
                </div>
                <Link href={`/dashboard/events/${event.id}`}>
                  <Button variant="outline" className="w-full">
                    View event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}