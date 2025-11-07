import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(public auth: AuthService, public router: Router) {}

  async logout() {
    await this.auth.signout();
    this.router.navigate(['/signin']);
  }
}
