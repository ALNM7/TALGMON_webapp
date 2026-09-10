import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-engineer-login',
  imports: [CommonModule, FormsModule, RouterLink, Logo],
  templateUrl: './engineer-login.html',
  styleUrl: './engineer-login.css',
})
export class EngineerLogin {
  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private readonly auth: Auth) {}

  submit() {
    if (!this.email.trim() || !this.password.trim() || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user.role !== 'ENGINEER') {
          this.errorMessage.set(
            'Esta cuenta no es de ingeniero de servicio. Usa el acceso de administrador.',
          );
          return;
        }
        this.auth.redirectAfterLogin(user);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Correo o contraseña incorrectos.');
      },
    });
  }
}
