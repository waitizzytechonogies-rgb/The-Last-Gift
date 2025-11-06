// src/app/signin.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-signin',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto">
      <h2 class="text-xl font-semibold mb-4">Sign in</h2>

      <input
        [(ngModel)]="email"
        placeholder="Email"
        class="w-full p-2 border rounded mb-2"
      />
      <input
        [(ngModel)]="password"
        placeholder="Password"
        type="password"
        class="w-full p-2 border rounded mb-4"
      />

      <div class="flex gap-2">
        <button
          (click)="doSignin()"
          class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Sign in
        </button>
      </div>
    </div>
  `,
})
export class SignInComponent {
  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  async doSignin() {
    try {
      await this.auth.signin(this.email, this.password);
      this.router.navigate(['/']); // ✅ redirect to Home after login
    } catch (e) {
      alert((e as any).message || e);
    }
  }
}
