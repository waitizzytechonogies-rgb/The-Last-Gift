import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Navbar -->
      <nav class="bg-white shadow p-4">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
          <a routerLink="/" class="font-semibold text-lg">People</a>

          <!-- Right side: auth actions -->
          <div class="flex items-center gap-3">
            <!-- Show these only if NOT logged in -->
            <ng-container *ngIf="!auth.isLoggedIn(); else loggedInTpl">
              <a
                routerLink="/signup"
                class="text-sm text-indigo-600 hover:underline"
                >Sign up</a
              >
              <a
                routerLink="/signin"
                class="text-sm text-indigo-600 hover:underline"
                >Sign in</a
              >
            </ng-container>

            <!-- Show when logged in -->
            <ng-template #loggedInTpl>
              <span class="text-sm text-gray-700"
                >Hi, {{ auth.user()?.email }}</span
              >
              <button
                (click)="logout()"
                class="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              >
                Sign out
              </button>
            </ng-template>
          </div>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto p-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}

  async logout() {
    await this.auth.signout();
    this.router.navigate(['/signin']);
  }
}
