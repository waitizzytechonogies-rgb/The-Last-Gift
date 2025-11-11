import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { SignInComponent } from './auth/signin.component';
import { SignUpComponent } from './auth/signup.component';
import { HomeComponent } from './home/home.component';
import { PersonComponent } from './person/person.component';
import { DriveGalleryComponent } from './drive-gallary/drive-gallery.component';

/**
 * Main routing configuration for the Angular 17 + Firebase app.
 *
 * - ''          → Home page (people list)
 * - 'person/:id'→ Protected page showing person details
 * - 'signup'    → Public signup page
 * - 'signin'    → Public signin page
 * - '**'        → Wildcard fallback redirect to '/'
 */

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full', // ✅ matches only the exact root ('/')
    canActivate: [authGuard],
  },
  {
    path: 'person/:id',
    component: PersonComponent,
    canActivate: [authGuard], // protect person pages
  },
  {
    path: 'person/:id/slideshow',
    component: DriveGalleryComponent,
    // canActivate: [authGuard], // protect person pages
  },
  {
    path: 'signup',
    component: SignUpComponent,
  },
  {
    path: 'signin',
    component: SignInComponent,
  },
  {
    path: '**',
    redirectTo: '', // fallback → home
    pathMatch: 'full', // ✅ ensures exact wildcard redirect
  },
];
