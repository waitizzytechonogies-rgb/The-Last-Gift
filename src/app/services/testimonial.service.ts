// src/app/services/testimonial.service.ts
import { Injectable } from '@angular/core';
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  constructor() {}

  /**
   * Adds a testimonial to people/{pid}.testimonials array.
   * If the document doesn't exist it will be created with the first testimonial.
   */
  async createTestimonial(pid: string, testimonial: any): Promise<boolean> {
    try {
      const docRef = doc(db, `people/${pid}`);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        await updateDoc(docRef, {
          testimonials: arrayUnion(testimonial),
        });
      } else {
        await setDoc(docRef, {
          testimonials: [testimonial],
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to save testimonial', err);
      return false;
    }
  }
}
