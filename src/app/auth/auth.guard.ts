// src/app/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

export const authGuard: CanActivateFn = async (
  route?: ActivatedRouteSnapshot,
  state?: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ensure Firebase has finished restoring auth state
  await auth.whenInitialized();

  const url =
    (state && state.url) ||
    (route && route.url?.map((s) => s.path).join('/')) ||
    '';

  // PUBLIC: allow person/:id pages (exact prefix)
  // Accept both "/person/abc" and "/person/abc?..." and "/person/abc/..."
  if (url.startsWith('/person/')) {
    return true;
  }

  // allow if logged in
  if (auth.isLoggedInSync()) {
    return true;
  }

  // otherwise redirect to signin and preserve intended return url
  return router.createUrlTree(['/signin'], { queryParams: { returnUrl: url } });
};
