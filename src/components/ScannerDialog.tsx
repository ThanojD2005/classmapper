
'use client';

import type { FC } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssign: (studentId: string) => Promise<void>;
  seatId: string | null;
}

export const ScannerDialog: FC<ScannerDialogProps> = ({ isOpen, onOpenChange, onAssign, seatId }) => {
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (!studentId) return;
    setSubmitting(true);
    await onAssign(studentId);
    setSubmitting(false);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let qrScanner: any = null;

    const startScanner = async () => {
      if (!isOpen) {
        setStudentId('');
        setSubmitting(false);
        return;
      }
      
      try {
        const QrScanner = (await import('qr-scanner')).default;
        
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          qrScanner = new QrScanner(
            videoRef.current,
            (result: any) => {
              if (result.data) {
                qrScanner.stop();
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                setSubmitting(true);
                onAssign(result.data).finally(() => setSubmitting(false));
              }
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          qrScanner.start();
        }
      } catch (error) {
        console.error('Error accessing camera or starting scanner:', error);
        setHasCameraPermission(false);
      }
    };

    startScanner();

    return () => {
      qrScanner?.stop();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onAssign]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Student to Seat {seatId}</DialogTitle>
          <DialogDescription>
            Scan the student's QR code or enter their ID below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-accent rounded-lg w-full aspect-video bg-black">
             <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted playsInline />
            {isSubmitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white">Assigning...</p>
                </div>
            )}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                 <Alert variant="destructive">
                    <QrCode className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        Please enable camera permissions in your browser to use the scanner.
                    </AlertDescription>
                </Alert>
              </div>
            )}
             {hasCameraPermission === null && !isSubmitting && (
                 <p className="absolute text-sm text-white">Requesting camera access...</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="student-id" className="text-right">
              ID
            </Label>
            <Input
              id="student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="col-span-3"
              placeholder="Enter ID Manually"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!studentId || isSubmitting}
            className="w-full sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Assigning...' : 'Assign Manually'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
