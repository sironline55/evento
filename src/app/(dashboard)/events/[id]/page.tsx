'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EventService } from '@/services/EventService';
import { AttendeeService } from '@/services/AttendeeService';
import { Event, Attendee } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApplePayRings } from '@/components/qr/ApplePayRings';
import { Users, CheckCircle, Clock, Download, Printer, QrCode } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function EventDetailPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      try {
        const eventService = new EventService();
        const attendeeService = new AttendeeService();

        const [eventData, attendeesData] = await Promise.all([
          eventService.getById(eventId),
          attendeeService.getByEvent(eventId),
        ]);

        setEvent(eventData);
        setAttendees(attendeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const exportAttendees = () => {
    const ws = XLSX.utils.json_to_sheet(attendees.map(attendee => ({
      Name: attendee.name || '',
      Company: attendee.company || '',
      'Ticket Type': attendee.ticketType || '',
      Status: attendee.status,
      'Registered At': new Date(attendee.registeredAt).toLocaleString(),
      'Attended At': attendee.attendedAt ? new Date(attendee.attendedAt).toLocaleString() : '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    XLSX.writeFile(wb, `${event?.title || 'event'}-attendees.xlsx`);
  };

  const printBadges = () => {
    // Placeholder for printing badges
    alert('Printing badges functionality would be implemented here');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!event) {
    return <div className="flex justify-center items-center h-64">Event not found</div>;
  }

  const totalAttendees = attendees.length;
  const checkedInCount = attendees.filter(a => a.status === 'attended').length;
  const registeredCount = attendees.filter(a => a.status === 'registered').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-600">{event.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(event.date).toLocaleDateString()} at {event.location}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/scanner">
            <Button>
              <QrCode className="mr-2 h-4 w-4" />
              Open Scanner
            </Button>
          </Link>
          <Button onClick={exportAttendees} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={printBadges} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Badges
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registeredCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplePayRings eventName={event.title} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.slice(0, 10).map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>{attendee.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        attendee.status === 'attended' ? 'bg-green-100 text-green-800' :
                        attendee.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {attendee.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {attendee.attendedAt ? new Date(attendee.attendedAt).toLocaleString() : 'Not checked in'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}