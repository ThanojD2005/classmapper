
import { z } from 'zod';

export const studentSchema = z.object({
  qrId: z.string(),
  studentId: z.string(),
});

export type Student = z.infer<typeof studentSchema>;

export const seatingInfoSchema = z.object({
  qrId: z.string(),
  studentId: z.string(),
  seatId: z.string(),
  isMarked: z.boolean().optional(),
});

export type SeatingInfo = z.infer<typeof seatingInfoSchema>;
