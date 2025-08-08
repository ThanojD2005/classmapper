
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import { studentSchema, type Student } from './types';


export async function addStudent(studentData: Omit<Student, 'qrId'> & { qrId: string }): Promise<void> {
  try {
    const validatedData = studentSchema.parse(studentData);
    // Use qrId as the document ID
    const studentRef = doc(db, 'students', validatedData.qrId);
    await setDoc(studentRef, {
      studentId: validatedData.studentId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Validation failed: ' + error.errors.map(e => e.message).join(', '));
    }
    console.error("Error adding student: ", error);
    throw new Error('Failed to add student to the database.');
  }
}

export async function getStudents(): Promise<Student[]> {
  try {
    const studentsCollection = collection(db, 'students');
    const studentSnapshot = await getDocs(studentsCollection);
    const studentList = studentSnapshot.docs.map(doc => ({
      qrId: doc.id,
      studentId: doc.data().studentId,
    }));
    return studentList;
  } catch (error) {
    console.error("Error getting students: ", error);
    throw new Error('Failed to fetch students from the database.');
  }
}

export async function deleteStudent(qrId: string): Promise<void> {
    try {
        if (!qrId) {
            throw new Error("QR ID is required to delete a student.");
        }
        const studentRef = doc(db, 'students', qrId);
        await deleteDoc(studentRef);
    } catch (error) {
        console.error("Error deleting student: ", error);
        throw new Error('Failed to delete student from the database.');
    }
}

export async function getStudentByQrId(qrId: string): Promise<Student | null> {
    try {
        if (!qrId) {
            return null;
        }
        const studentRef = doc(db, 'students', qrId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
            return {
                qrId: studentSnap.id,
                studentId: studentSnap.data().studentId,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting student by QR ID: ", error);
        throw new Error('Failed to fetch student from the database.');
    }
}

    