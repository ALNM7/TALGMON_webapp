import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import {
  Observable,
  catchError,
  filter,
  finalize,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { Auth } from '../services/auth';

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Endpoints de sesión que nunca deben disparar un refresh al recibir 401. */
const NO_REFRESH_PATHS = ['/auth/login/', '/auth/refresh/', '/auth/logout/', '/auth/csrf/'];

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function withCsrf(req: HttpRequest<unknown>): HttpRequest<unknown> {
  if (!UNSAFE_METHODS.includes(req.method)) return req;
  const csrfToken = readCookie('csrftoken');
  return csrfToken ? req.clone({ setHeaders: { 'X-CSRFToken': csrfToken } }) : req;
}

/**
 * Refresh en curso compartido: si varias peticiones reciben 401 al mismo
 * tiempo (p. ej. al abrir el dashboard) se hace un solo POST a
 * /auth/refresh/. Con la rotación de refresh tokens del backend, dos
 * refresh simultáneos harían que el segundo fallara.
 */
let refreshInFlight: Observable<unknown> | null = null;

function refreshSession(next: HttpHandlerFn): Observable<unknown> {
  if (!refreshInFlight) {
    const req = withCsrf(
      new HttpRequest('POST', `${environment.apiUrl}/auth/refresh/`, null, {
        withCredentials: true,
      }),
    );
    refreshInFlight = next(req).pipe(
      // next() también emite el evento "Sent"; solo interesa la respuesta.
      filter((event) => event.type === HttpEventType.Response),
      take(1),
      finalize(() => (refreshInFlight = null)),
      shareReplay(1),
    );
  }
  return refreshInFlight;
}

/**
 * Agrega credenciales (cookies HttpOnly del JWT) y el header CSRF a cada
 * request que va hacia el backend de TAGLMON. El valor de X-CSRFToken se
 * lee de la cookie csrftoken que Django manda (no HttpOnly a propósito).
 *
 * El access token dura 15 minutos. Si una petición regresa 401, se renueva
 * la sesión con el refresh token (7 días) y se reintenta una sola vez, sin
 * que el usuario lo note. Si el refresh también falla, la sesión terminó de
 * verdad y se manda al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const injector = inject(Injector);
  const authReq = withCsrf(req.clone({ withCredentials: true }));
  const canRefresh = !NO_REFRESH_PATHS.some((path) => req.url.endsWith(path));

  return next(authReq).pipe(
    catchError((error: unknown): Observable<HttpEvent<unknown>> => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !canRefresh) {
        return throwError(() => error);
      }
      return refreshSession(next).pipe(
        // El refresh puede rotar cookies; se vuelve a leer el CSRF.
        switchMap(() => next(withCsrf(req.clone({ withCredentials: true })))),
        catchError((retryError: unknown) => {
          if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
            injector.get(Auth).sessionExpired();
          }
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
