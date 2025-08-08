
'use client';

import type { FC } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { QrCode } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QrScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (qrId: string) => void;
}

export const QrScannerDialog: FC<QrScannerDialogProps> = ({ isOpen, onOpenChange, onScan }) => {
  const [manualQrId, setManualQrId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let qrScanner: any = null;

    const startScanner = async () => {
      if (!isOpen) return;

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
                onScan(result.data);
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
  }, [isOpen, onScan]);
  
  const handleManualSubmit = () => {
    if (!manualQrId) return;
    onScan(manualQrId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at a QR code, or enter the ID manually below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-accent rounded-lg w-full aspect-video bg-black">
            <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted playsInline />
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
            {hasCameraPermission === null && (
                 <p className="absolute text-sm text-white">Requesting camera access...</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="qr-id" className="text-right">
              QR ID
            </Label>
            <Input
              id="qr-id"
              value={manualQrId}
              onChange={(e) => setManualQrId(e.target.value)}
              className="col-span-3"
              placeholder="Enter ID Manually"
              onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleManualSubmit}
            disabled={!manualQrId}
          >
            Confirm Manually
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
