import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Agrega credenciales (cookies HttpOnly del JWT) y el header CSRF a cada
 * request que va hacia el backend de TAGLMON. El valor de X-CSRFToken se
 * lee de la cookie csrftoken que Django manda (no HttpOnly a propósito).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  let authReq = req.clone({ withCredentials: true });

  if (UNSAFE_METHODS.includes(req.method)) {
    const csrfToken = readCookie('csrftoken');
    if (csrfToken) {
      authReq = authReq.clone({ setHeaders: { 'X-CSRFToken': csrfToken } });
    }
  }

  return next(authReq);
};
