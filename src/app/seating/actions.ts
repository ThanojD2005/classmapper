
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { SeatingInfo } from '../students/types';

const SEATING_DOC_ID = 'main_classroom';

export async function getSeatingArrangement(): Promise<Map<string, SeatingInfo>> {
  try {
    const seatingRef = doc(db, 'seating', SEATING_DOC_ID);
    const seatingSnap = await getDoc(seatingRef);

    if (seatingSnap.exists()) {
      const data = seatingSnap.data();
      // Firestore returns an object, convert it back to a Map
      return new Map(Object.entries(data));
    } else {
      // If no seating arrangement is found, return an empty map
      return new Map();
    }
  } catch (error) {
    console.error("Error getting seating arrangement: ", error);
    throw new Error('Failed to fetch seating arrangement from the database.');
  }
}

export async function updateSeatingArrangement(arrangement: Map<string, SeatingInfo>): Promise<void> {
  try {
    const seatingRef = doc(db, 'seating', SEATING_DOC_ID);
    // Convert Map to a plain object for Firestore
    const arrangementObject = Object.fromEntries(arrangement);
    await setDoc(seatingRef, arrangementObject);
  } catch (error) {
    console.error("Error updating seating arrangement: ", error);
    throw new Error('Failed to update seating arrangement in the database.');
  }
}

    