import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { Auth } from '../../../core/services/auth';
import { Orders } from '../../../core/services/orders';
import { OrderListItem } from '../../../core/models/order.model';

const STATUS_LABEL: Record<string, string> = {
  completado: 'Completado',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
};

const STATUS_STYLE: Record<string, string> = {
  completado: 'bg-ok-50 text-ok',
  en_proceso: 'bg-brand-50 text-brand',
  pendiente: 'bg-warn-50 text-warn',
};

@Component({
  selector: 'app-engineer-home',
  imports: [CommonModule, RouterLink, Logo],
  templateUrl: './engineer-home.html',
  styleUrl: './engineer-home.css',
})
export class EngineerHome implements OnInit {
  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  statusLabel = STATUS_LABEL;
  statusStyle = STATUS_STYLE;

  constructor(
    private readonly auth: Auth,
    private readonly ordersService: Orders,
    private readonly router: Router,
  ) {}

  get userName(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  }

  get firstName(): string {
    return this.userName.split(' ')[0] || this.userName;
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  ngOnInit() {
    this.ordersService.list().subscribe({
      next: (res) => {
        this.orders.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  logout() {
    this.auth.logout().subscribe({
      complete: () => this.router.navigateByUrl('/ingeniero/login'),
      error: () => this.router.navigateByUrl('/ingeniero/login'),
    });
  }
}
