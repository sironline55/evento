'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AttendeeService } from '@/services/AttendeeService';
import { Attendee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

export default function AttendeesPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!eventId) return;
      try {
        const attendeeService = new AttendeeService();
        const data = await attendeeService.getByEvent(eventId);
        setAttendees(data);
        setFilteredAttendees(data);
      } catch (error) {
        console.error('Error fetching attendees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  useEffect(() => {
    let filtered = attendees;

    if (search) {
      filtered = filtered.filter(attendee =>
        attendee.name?.toLowerCase().includes(search.toLowerCase()) ||
        attendee.company?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.status === statusFilter);
    }

    setFilteredAttendees(filtered);
  }, [attendees, search, statusFilter]);

  const generateQR = async (attendee: Attendee) => {
    const data = JSON.stringify({
      id: attendee.id,
      name: attendee.name,
      eventId: attendee.eventId,
    });
    const qr = await QRCode.toDataURL(data);
    setQrData(qr);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAttendees.map(attendee => ({
      Name: attendee.name || '',
      Company: attendee.company || '',
      'Ticket Type': attendee.ticketType || '',
      Status: attendee.status,
      'Check-in Time': attendee.attendedAt ? new Date(attendee.attendedAt).toLocaleString() : '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    XLSX.writeFile(wb, 'attendees.xlsx');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendees</h1>
        <Button onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <div className="flex space-x-4">
        <Input
          placeholder="Search by name or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Ticket Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check-in Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAttendees.map((attendee) => (
            <TableRow key={attendee.id}>
              <TableCell>{attendee.name || 'N/A'}</TableCell>
              <TableCell>{attendee.company || 'N/A'}</TableCell>
              <TableCell>{attendee.ticketType || 'N/A'}</TableCell>
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
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => generateQR(attendee)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR Code for {attendee.name}</DialogTitle>
                    </DialogHeader>
                    {qrData && <img src={qrData} alt="QR Code" className="mx-auto" />}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}