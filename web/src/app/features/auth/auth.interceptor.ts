import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !authReq.url.includes('auth/refresh')) {
        return handle401Error(authReq, next, authService, router) as Observable<HttpEvent<unknown>>;
      }
      return throwError(() => error);
    }),
  );
};

const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> => {
  if (!isRefreshing) {
    isRefreshing = true;

    // store the promise so parallel requests wait on the same one
    refreshPromise = new Promise((resolve, reject) => {
      authService.refreshToken().subscribe({
        next: (res) => {
          isRefreshing = false;
          refreshPromise = null;
          resolve(res.access_token);
        },
        error: (err) => {
          isRefreshing = false;
          refreshPromise = null;
          authService.logout();
          router.navigate(['/login']);
          reject(err);
        },
      });
    });
  }

  return from(refreshPromise!).pipe(
    switchMap((newToken: string) =>
      next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        }),
      ),
    ),
    catchError((err) => throwError(() => err)),
  );
};
