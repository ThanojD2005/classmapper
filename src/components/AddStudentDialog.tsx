
'use client';

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import type { Student } from '@/app/students/types';

const addStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;

interface AddStudentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  qrId: string;
  onSubmit: (data: AddStudentFormValues) => Promise<void>;
}

export const AddStudentDialog: FC<AddStudentDialogProps> = ({ isOpen, onOpenChange, qrId, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
  });

  const handleFormSubmit: SubmitHandler<AddStudentFormValues> = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            This QR code is not registered. Please enter the student's details to add them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="qrId">QR Code ID</Label>
                <Input id="qrId" value={qrId} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                id="studentId"
                {...register('studentId')}
                placeholder="e.g., s67890"
                />
                {errors.studentId && (
                <p className="text-sm text-destructive">{errors.studentId.message}</p>
                )}
            </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Adding...' : 'Add and Assign Student'}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
