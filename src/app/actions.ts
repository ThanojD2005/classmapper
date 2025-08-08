
'use server';

export interface GetStudentErrorMessageOutput {
  isSeated: boolean;
  message: string;
}

export async function checkStudentSeating(
  studentId: string,
  assignedSeat: string,
  currentSeatingArrangement: Record<string, string>
): Promise<GetStudentErrorMessageOutput> {

  if (!studentId) {
    return {
      isSeated: false,
      message: 'Student ID cannot be empty.',
    };
  }

  for (const seat in currentSeatingArrangement) {
    if (currentSeatingArrangement[seat] === studentId) {
      return {
        isSeated: true,
        message: `Student with QR ID ${studentId} is already seated at ${seat}.`,
      };
    }
  }

  return {
    isSeated: false,
    message: '',
  };
}
