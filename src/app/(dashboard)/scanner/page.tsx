'use client';

import { useEffect, useRef, useState } from 'react';
import { AttendeeService } from '@/services/AttendeeService';
import { EventService } from '@/services/EventService';
import { Attendee, Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Search, CheckCircle } from 'lucide-react';
import jsQR from 'jsqr';

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventService = new EventService();
      const data = await eventService.getAll();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const fetchAttendees = async () => {
        const attendeeService = new AttendeeService();
        const data = await attendeeService.getByEvent(selectedEventId);
        setAttendees(data);
        setTotalCount(data.length);
        setCheckedInCount(data.filter(a => a.status === 'attended').length);
      };
      fetchAttendees();
    }
  }, [selectedEventId]);

  const startScanning = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQR();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const scanQR = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          const data = JSON.parse(code.data);
          const attendee = attendees.find(a => a.id === data.id);
          if (attendee) {
            setScannedAttendee(attendee);
            stopScanning();
          }
        } catch (error) {
          console.error('Invalid QR code data:', error);
        }
      }
    }

    if (scanning) {
      requestAnimationFrame(scanQR);
    }
  };

  const confirmCheckIn = async () => {
    if (!scannedAttendee) return;

    const attendeeService = new AttendeeService();
    await attendeeService.updateStatus(scannedAttendee.id, 'attended', new Date().toISOString());
    setCheckedInCount(prev => prev + 1);
    setScannedAttendee(null);
  };

  const handleManualSearch = (query: string) => {
    setManualSearch(query);
    if (query.length > 2) {
      const results = attendees.filter(attendee =>
        attendee.name?.toLowerCase().includes(query.toLowerCase()) ||
        attendee.id.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const checkInManual = async (attendee: Attendee) => {
    const attendeeService = new AttendeeService();
    await attendeeService.updateStatus(attendee.id, 'attended', new Date().toISOString());
    setCheckedInCount(prev => prev + 1);
    setSearchResults([]);
    setManualSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
          <div className="text-lg font-semibold">
            Checked-in: {checkedInCount} / {totalCount}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {!scanning ? (
                  <Button onClick={startScanning} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex-1">
                    Stop Scanning
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search by name or ID..."
                value={manualSearch}
                onChange={(e) => handleManualSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map(attendee => (
                  <div key={attendee.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{attendee.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{attendee.status}</p>
                    </div>
                    {attendee.status !== 'attended' && (
                      <Button size="sm" onClick={() => checkInManual(attendee)}>
                        Check In
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!scannedAttendee} onOpenChange={() => setScannedAttendee(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendee Found</DialogTitle>
            </DialogHeader>
            {scannedAttendee && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Name: {scannedAttendee.name || 'N/A'}</p>
                  <p>Company: {scannedAttendee.company || 'N/A'}</p>
                  <p>Ticket Type: {scannedAttendee.ticketType || 'N/A'}</p>
                  <p>Status: {scannedAttendee.status}</p>
                </div>
                {scannedAttendee.status !== 'attended' && (
                  <Button onClick={confirmCheckIn} className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Check-in
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}