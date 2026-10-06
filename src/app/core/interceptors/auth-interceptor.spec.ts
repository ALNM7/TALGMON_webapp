import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '../services/auth';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    document.cookie = 'csrftoken=abc123';
  });

  afterEach(() => backend.verify());

  it('agrega X-CSRFToken y credenciales en POST al API', () => {
    http.post('/api/orders/', {}).subscribe();
    const req = backend.expectOne('/api/orders/');
    expect(req.request.headers.get('X-CSRFToken')).toBe('abc123');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('no toca peticiones fuera del API', () => {
    http.post('https://otro.com/x', {}).subscribe();
    const req = backend.expectOne('https://otro.com/x');
    expect(req.request.headers.has('X-CSRFToken')).toBe(false);
    req.flush({});
  });

  it('ante un 401 renueva la sesión una sola vez y reintenta', () => {
    const results: unknown[] = [];
    http.get('/api/orders/').subscribe((r) => results.push(r));
    http.get('/api/auth/me/').subscribe((r) => results.push(r));

    backend.expectOne('/api/orders/').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/me/').flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = backend.expectOne('/api/auth/refresh/');
    expect(refresh.request.method).toBe('POST');
    refresh.flush(null, { status: 204, statusText: 'No Content' });

    backend.expectOne('/api/orders/').flush({ ok: 1 });
    backend.expectOne('/api/auth/me/').flush({ ok: 2 });
    expect(results).toEqual([{ ok: 1 }, { ok: 2 }]);
  });

  it('si el refresh falla, avisa que la sesión expiró', () => {
    const auth = TestBed.inject(Auth);
    const spy = vi.spyOn(auth, 'sessionExpired');
    let status = 0;
    http.get('/api/orders/').subscribe({ error: (e) => (status = e.status) });

    backend.expectOne('/api/orders/').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh/').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(spy).toHaveBeenCalled();
  });

  it('no intenta refresh si falla el propio login', () => {
    http.post('/api/auth/login/', {}).subscribe({ error: () => {} });
    backend.expectOne('/api/auth/login/').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone('/api/auth/refresh/');
  });
});
