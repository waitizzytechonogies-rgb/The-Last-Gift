// src/app/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * AuthService (Angular 17 signals)
 * - Reactive signals: user, isLoggedIn
 * - Synchronous helper: isLoggedIn()
 * - whenInitialized(): Promise<void> -> resolves when Firebase has emitted its first auth state
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // internal signal for current user (null when not logged in)
  private _user = signal<User | null>(null);

  // public computed signal (use in templates/components)
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());

  // whether we've received the initial auth state from Firebase
  private _initialized = signal(false);
  initialized = computed(() => this._initialized());

  constructor() {
    // Listen for auth state changes and update signals.
    // onAuthStateChanged fires immediately with the cached value (or null)
    // and later when sign-in/out occurs.
    onAuthStateChanged(auth, (u) => {
      this._user.set(u);
      // mark initialized on the first event (keeps guards/components able to wait)
      if (!this._initialized()) {
        this._initialized.set(true);
      }
    });
  }

  /** Wait until Firebase has emitted the first auth state (useful in guards) */
  whenInitialized(): Promise<void> {
    if (this._initialized()) return Promise.resolve();
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        // sync the user as well in case constructor hasn't run yet (safe)
        this._user.set(u);
        this._initialized.set(true);
        unsub();
        resolve();
      });
    });
  }

  /** Non-reactive quick check (useful in guards or quick conditionals) */
  isLoggedInSync(): boolean {
    return !!this._user();
  }

  /** Create account */
  async signup(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // cred.user should now be set by onAuthStateChanged as well,
    // but update signal immediately for UI responsiveness.
    this._user.set(cred.user);
    return cred.user;
  }

  /** Sign in */
  async signin(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    this._user.set(cred.user);
    return cred.user;
  }

  /** Sign out */
  async signout() {
    await signOut(auth);
    this._user.set(null);
  }

  /** Convenience: get the raw current user from the Firebase SDK */
  get currentUser(): User | null {
    return auth.currentUser;
  }
}
