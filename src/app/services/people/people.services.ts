import { Injectable, inject } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
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
import { AuthService } from '../../auth/auth.service';
import { db } from '../../firebase';
import { People } from '../../interfaces/people';

const peopleCol = collection(db, 'people');

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private auth = inject(AuthService);

  async list() {
    const q = query(peopleCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  }

  async add(person: People, photoFile?: File | null) {
    const createdByUid = this.auth.currentUser?.uid ?? null;

    // 1) Upload new photo if provided
    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await this.uploadPhoto(photoFile, createdByUid);
    }

    // 2) Add Firestore document
    const docRef = await addDoc(peopleCol, {
      name: person.name,
      dob: person.dob ?? null,
      description: person.about ?? null,
      photoUrl,
      createdAt: serverTimestamp(),
      createdBy: createdByUid,
    });

    return docRef.id;
  }

  async get(id: string) {
    const d = doc(db, 'people', id);
    const snap = await getDoc(d);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as DocumentData;
  }

  // Update existing person
  async update(id: string, person: Partial<People>) {
    const d = doc(db, 'people', id);

    await updateDoc(d, person);
  }

  // 🔧 Helper: handle Storage upload
  async uploadPhoto(
    file: File,
    ownerUid: string | null = this.auth.currentUser?.uid!,
    compress = false,
    maxWidth = 1200,
    quality = 0.85
  ): Promise<string> {
    // Helper: perform client-side compression & return a Blob
    const compressToBlob = (
      file: File,
      maxW: number,
      q: number
    ): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed reading file'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Invalid image'));
          img.onload = () => {
            // compute target size
            const ratio = img.width / img.height;
            const w = Math.min(maxW, img.width);
            const h = Math.round(w / ratio);

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            // choose output type — preserve PNG where possible, otherwise JPEG
            const outputType =
              file.type === 'image/png' ? 'image/png' : 'image/jpeg';

            // toBlob is async
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('Failed to create blob'));
                resolve(blob);
              },
              outputType,
              q
            );
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    // Prepare upload blob / file
    let uploadBlob: Blob | File = file;

    if (compress) {
      try {
        const compressed = await compressToBlob(file, maxWidth, quality);
        // create a File object so uploadBytesResumable retains filename & type if you want
        const ext =
          file.name.split('.').pop() ||
          (file.type === 'image/png' ? 'png' : 'jpg');
        const compressedFile = new File(
          [compressed],
          `${Date.now()}_compressed.${ext}`,
          { type: compressed.type }
        );
        uploadBlob = compressedFile;
      } catch (err) {
        // on compression error, fall back to original file
        console.warn('Image compression failed, uploading original file', err);
        uploadBlob = file;
      }
    }

    // upload to Firebase Storage (same path logic)
    const storage = getStorage();
    const owner = ownerUid ?? 'anon';
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const path = `people/${owner}/${filename}`;
    const sRef = storageRef(storage, path);

    return new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(sRef, uploadBlob);
      uploadTask.on(
        'state_changed',
        () => {
          /* optional progress handler */
        },
        (err) => reject(err),
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }
}
