import { Injectable, inject } from '@angular/core';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { AuthService } from './auth/auth.service';

const peopleCol = collection(db, 'people');

export interface PersonCreate {
  name: string;
  dob?: string; // ISO date string e.g. '1990-05-20'
  description?: string;
  // optional other fields
}

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private auth = inject(AuthService);

  async list() {
    const q = query(peopleCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  }

  /**
   * Add a person.
   * - person: object (name, dob, description)
   * - photoFile: optional File (image) to upload to Firebase Storage
   *
   * Returns the created doc id.
   */
  async add(person: PersonCreate, photoFile?: File | null) {
    const createdByUid = this.auth.currentUser?.uid ?? null;

    // 1) If photoFile provided, upload to Storage and get URL
    let photoUrl: string | null = null;
    if (photoFile) {
      const storage = getStorage();
      // path: people/{uid or 'anon'}/{timestamp}_{filename}
      const owner = createdByUid ?? 'anon';
      const filename = `${Date.now()}_${photoFile.name.replace(/\s+/g, '_')}`;
      const path = `people/${owner}/${filename}`;
      const sRef = storageRef(storage, path);

      // upload
      await new Promise<void>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(sRef, photoFile);
        uploadTask.on(
          'state_changed',
          () => {}, // optional progress handler
          (err) => reject(err),
          async () => {
            photoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          }
        );
      });
    }

    // 2) write the document in Firestore
    const docRef = await addDoc(peopleCol, {
      name: person.name,
      dob: person.dob ?? null,
      description: person.description ?? null,
      photoUrl,
      createdAt: serverTimestamp(),
      createdBy: createdByUid, // store the UID (can look up email later if needed)
    });

    return docRef.id;
  }

  async get(id: string) {
    const d = doc(db, 'people', id);
    const snap = await getDoc(d);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as DocumentData;
  }
}
