import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user.model';

/**
 * Maneja la sesión del usuario. El JWT vive en cookies HttpOnly puestas
 * por el backend (ver accounts/views.py); este servicio nunca ve ni
 * guarda el token, solo el perfil del usuario para la UI.
 */
@Service()
export class Auth {
  private readonly baseUrl = environment.apiUrl;

  private readonly currentUserSignal = signal<AppUser | null>(null);
  private readonly checkedSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly checked = this.checkedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isEngineer = computed(() => this.currentUserSignal()?.role === 'ENGINEER');
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Se llama una vez al arrancar la app para saber si ya hay sesión
   * (cookie HttpOnly válida) y para obtener la cookie CSRF. */
  bootstrap(): Observable<AppUser | null> {
    return new Observable<AppUser | null>((subscriber) => {
      this.http.get(`${this.baseUrl}/auth/csrf/`, { withCredentials: true }).subscribe({
        next: () => this.fetchMe(subscriber),
        error: () => this.fetchMe(subscriber),
      });
    });
  }

  private fetchMe(subscriber: { next: (u: AppUser | null) => void; complete: () => void }) {
    this.http
      .get<AppUser>(`${this.baseUrl}/auth/me/`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          this.currentUserSignal.set(user);
          this.checkedSignal.set(true);
          subscriber.next(user);
          subscriber.complete();
        },
        error: () => {
          this.currentUserSignal.set(null);
          this.checkedSignal.set(true);
          subscriber.next(null);
          subscriber.complete();
        },
      });
  }

  login(email: string, password: string): Observable<AppUser> {
    return this.http
      .post<AppUser>(
        `${this.baseUrl}/auth/login/`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  /** Cierra sesión. Aunque el backend falle (sin red, sesión ya vencida),
   * el estado local se limpia igual para no dejar al usuario "a medias". */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/auth/logout/`, {}, { withCredentials: true })
      .pipe(finalize(() => this.currentUserSignal.set(null)));
  }

  /** Lo llama el interceptor cuando ni el refresh token sirve: la sesión
   * terminó de verdad y hay que volver a iniciar sesión. */
  sessionExpired() {
    const user = this.currentUserSignal();
    if (!user) return;
    this.currentUserSignal.set(null);
    this.router.navigateByUrl(user.role === 'ADMIN' ? '/admin/login' : '/ingeniero/login');
  }

  redirectAfterLogin(user: AppUser) {
    if (user.role === 'ADMIN') {
      this.router.navigateByUrl('/admin/dashboard');
    } else {
      this.router.navigateByUrl('/ingeniero/inicio');
    }
  }
}
