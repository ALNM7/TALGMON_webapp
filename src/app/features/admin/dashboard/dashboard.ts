import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { Auth } from '../../../core/services/auth';
import { Orders } from '../../../core/services/orders';
import { OrderListItem, ServiceType, OrderStatus } from '../../../core/models/order.model';

const SERVICE_LABELS: Record<ServiceType, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
  diagnostico: 'Diagnóstico',
  instalacion: 'Instalación',
  otro: 'Otro',
};

const SERVICE_COLORS: Record<ServiceType, string> = {
  preventivo: 'bg-ok-50 text-ok',
  correctivo: 'bg-warn-50 text-warn',
  diagnostico: 'bg-brand-50 text-brand',
  instalacion: 'bg-ink-100 text-ink',
  otro: 'bg-ink-100 text-ink',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: 'bg-warn-50 text-warn',
  en_proceso: 'bg-brand-50 text-brand-600',
  completado: 'bg-ok-50 text-ok',
};

const ALL = 'todos';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, Logo],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly ALL = ALL;
  readonly serviceLabels = SERVICE_LABELS;
  readonly serviceColors = SERVICE_COLORS;
  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;
  readonly serviceTypeKeys = Object.keys(SERVICE_LABELS) as ServiceType[];
  readonly statusKeys = Object.keys(STATUS_LABELS) as OrderStatus[];

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  showFilters = signal(false);

  search = signal('');
  filterType = signal<string>(ALL);
  filterStatus = signal<string>(ALL);
  filterEngineer = signal<string>(ALL);

  engineers = computed(() => {
    const map = new Map<number, string>();
    for (const o of this.orders()) {
      map.set(o.engineer.id, `${o.engineer.first_name} ${o.engineer.last_name}`.trim());
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.orders().filter((o) => {
      const matchSearch =
        !q ||
        o.folio.toLowerCase().includes(q) ||
        o.equipo.toLowerCase().includes(q) ||
        o.unidad_aplicativa.toLowerCase().includes(q) ||
        o.marca.toLowerCase().includes(q);
      const matchType = this.filterType() === ALL || o.tipo_servicio === this.filterType();
      const matchStatus = this.filterStatus() === ALL || o.status === this.filterStatus();
      const matchEngineer =
        this.filterEngineer() === ALL || String(o.engineer.id) === this.filterEngineer();
      return matchSearch && matchType && matchStatus && matchEngineer;
    });
  });

  completedCount = computed(() => this.orders().filter((o) => o.status === 'completado').length);
  inProcessCount = computed(() => this.orders().filter((o) => o.status === 'en_proceso').length);
  pendingCount = computed(() => this.orders().filter((o) => o.status === 'pendiente').length);
  thisMonthCount = computed(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return this.orders().filter((o) => o.created_at.startsWith(prefix)).length;
  });

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.filterType() !== ALL) n++;
    if (this.filterStatus() !== ALL) n++;
    if (this.filterEngineer() !== ALL) n++;
    return n;
  });

  constructor(
    private readonly auth: Auth,
    private readonly ordersService: Orders,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    // page_size alto para que la tabla del dashboard no tenga que paginar
    // en el cliente (ver orders/pagination.py en el backend).
    this.ordersService.list({ page_size: 200 }).subscribe({
      next: (res) => {
        this.orders.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  str(id: number): string {
    return String(id);
  }

  clearFilters() {
    this.filterType.set(ALL);
    this.filterStatus.set(ALL);
    this.filterEngineer.set(ALL);
  }

  openOrder(id: number) {
    this.router.navigate(['/ordenes', id]);
  }

  exportXlsxUrl(): string {
    return this.ordersService.exportXlsxUrl({
      search: this.search() || undefined,
      tipo_servicio: this.filterType() !== ALL ? this.filterType() : undefined,
      status: this.filterStatus() !== ALL ? this.filterStatus() : undefined,
      engineer: this.filterEngineer() !== ALL ? this.filterEngineer() : undefined,
    });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/admin/login'));
  }
}
