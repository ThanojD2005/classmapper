
'use client';

import type { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import type { SeatingInfo } from '@/app/students/types';
import { User, Trash2, X } from 'lucide-react';

interface StudentInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: SeatingInfo;
  onRemove: (seatId: string) => void;
}

export const StudentInfoDialog: FC<StudentInfoDialogProps> = ({ isOpen, onOpenChange, student, onRemove }) => {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Information for the student assigned to seat {student.seatId}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="bg-primary/20 p-3 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-lg text-foreground truncate">ID: {student.studentId}</p>
                    <p className="text-sm text-muted-foreground truncate">QR: {student.qrId}</p>
                </div>
            </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="destructive" onClick={() => onRemove(student.seatId)}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove Assignment
          </Button>
          <DialogClose asChild>
            <Button variant="outline">
                <X className="mr-2 h-4 w-4" />
                Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
