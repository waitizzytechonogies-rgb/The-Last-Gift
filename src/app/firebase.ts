
export const firebaseConfig = {
  apiKey: 'AIzaSyDoG9wBmWcZgd14RwCpCkrdxaq465kOiKg',
  authDomain: 'the-last-gift.firebaseapp.com',
  projectId: 'the-last-gift',
  storageBucket: 'the-last-gift.firebasestorage.app',
  messagingSenderId: '721301226171',
  appId: '1:721301226171:web:ddd8f0b5abac727b435f9e',
  measurementId: 'G-LS5MK33QRW',
};

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
