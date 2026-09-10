import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { Auth } from './core/services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Antes de que el router active la primera ruta, preguntamos al
    // backend si ya hay una sesión válida (cookie HttpOnly). Así los
    // guards de rol nunca corren con un estado de auth "a medias".
    provideAppInitializer(() => {
      const auth = inject(Auth);
      return firstValueFrom(auth.bootstrap());
    }),
  ],
};
