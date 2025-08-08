
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QrCode, Trash2, UserPlus, Users } from 'lucide-react';
import { addStudent, getStudents, deleteStudent } from './actions';
import { QrScannerDialog } from '@/components/QrScannerDialog';
import type { Student } from './types';

const studentFormSchema = z.object({
  qrId: z.string().min(1, 'QR Code ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;


export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setScannerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const fetchedStudents = await getStudents();
      setStudents(fetchedStudents);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching students',
        description: 'Could not load student data. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    try {
      await addStudent(data);
      toast({
        title: 'Student Added',
        description: `Student ${data.studentId} has been added successfully.`,
      });
      reset();
      fetchStudents(); // Refresh the list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding student',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleDeleteStudent = async (qrId: string) => {
    try {
      await deleteStudent(qrId);
      toast({
        title: 'Student Deleted',
        description: `Student has been removed successfully.`,
      });
      fetchStudents(); // Refresh the list
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting student',
        description: 'An unexpected error occurred.',
      });
    }
  };
  
  const handleQrScan = (qrId: string) => {
    setValue('qrId', qrId, { shouldValidate: true });
    setScannerOpen(false);
    toast({
      title: 'QR Code Scanned',
      description: `QR ID "${qrId}" has been entered.`,
    });
  };


  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
        </header>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add New Student</CardTitle>
                <CardDescription>
                  Fill in the details to add a new student.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrId">QR Code ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="qrId"
                        {...register('qrId')}
                        placeholder="Scan or enter QR code"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
                        <QrCode />
                      </Button>
                    </div>
                    {errors.qrId && (
                      <p className="text-sm text-destructive">{errors.qrId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      {...register('studentId')}
                      placeholder="e.g., s12345"
                    />
                    {errors.studentId && (
                      <p className="text-sm text-destructive">{errors.studentId.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <UserPlus className="mr-2" />
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Student List</CardTitle>
                <CardDescription>A list of all students in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>QR Code ID</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : students.length > 0 ? (
                        students.map((student) => (
                          <TableRow key={student.qrId}>
                            <TableCell className="font-mono">{student.qrId}</TableCell>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStudent(student.qrId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No students found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <QrScannerDialog 
        isOpen={isScannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleQrScan}
      />
    </>
  );
}
