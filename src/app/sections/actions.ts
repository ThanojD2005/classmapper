
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Section } from './types';

const SECTIONS_DOC_ID = 'main_classroom_layout';

export async function getSections(): Promise<Section[]> {
  try {
    const sectionsRef = doc(db, 'sections', SECTIONS_DOC_ID);
    const sectionsSnap = await getDoc(sectionsRef);

    if (sectionsSnap.exists()) {
      const data = sectionsSnap.data();
      return data.sections || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting sections: ", error);
    throw new Error('Failed to fetch sections from the database.');
  }
}

export async function updateSections(sections: Section[]): Promise<void> {
  try {
    const sectionsRef = doc(db, 'sections', SECTIONS_DOC_ID);
    await setDoc(sectionsRef, { sections });
  } catch (error) {
    console.error("Error updating sections: ", error);
    throw new Error('Failed to update sections in the database.');
  }
}

    