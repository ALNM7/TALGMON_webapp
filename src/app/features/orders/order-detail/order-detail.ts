import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { Auth } from '../../../core/services/auth';
import { Orders } from '../../../core/services/orders';
import { OrderDetail as OrderDetailModel, OrderStatus } from '../../../core/models/order.model';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completado', label: 'Completado' },
];

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, FormsModule, Logo],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  order = signal<OrderDetailModel | null>(null);
  loading = signal(true);
  statusOptions = STATUS_OPTIONS;
  updatingStatus = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ordersService: Orders,
    private readonly location: Location,
    readonly auth: Auth,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.ordersService.get(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack() {
    this.location.back();
  }

  pdfUrl(): string {
    const order = this.order();
    return order ? this.ordersService.pdfUrl(order.id) : '';
  }

  photosByPhase(phase: 'ANTES' | 'DURANTE' | 'DESPUES') {
    return this.order()?.photos.filter((p) => p.phase === phase) ?? [];
  }

  onStatusChange(newStatus: string) {
    const order = this.order();
    if (!order) return;
    this.updatingStatus.set(true);
    this.ordersService.updateStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.updatingStatus.set(false);
      },
      error: () => this.updatingStatus.set(false),
    });
  }
}
