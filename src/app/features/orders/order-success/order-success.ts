import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { Orders } from '../../../core/services/orders';

@Component({
  selector: 'app-order-success',
  imports: [CommonModule, RouterLink, Logo],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css',
})
export class OrderSuccess implements OnInit {
  folio = signal('');
  pdfUrl = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ordersService: Orders,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.pdfUrl.set(this.ordersService.pdfUrl(id));
    this.ordersService.get(id).subscribe((order) => this.folio.set(order.folio));
  }
}
