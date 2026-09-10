import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { OrderDetail, OrderDraft, OrderListItem } from '../models/order.model';

export interface OrderListFilters {
  search?: string;
  tipo_servicio?: string;
  status?: string;
  engineer?: number | string;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Service()
export class Orders {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  private readonly http = inject(HttpClient);

  list(filters: OrderListFilters = {}): Observable<PaginatedResponse<OrderListItem>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<OrderListItem>>(`${this.baseUrl}/`, { params });
  }

  get(id: number | string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.baseUrl}/${id}/`);
  }

  updateStatus(id: number | string, status: string): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(`${this.baseUrl}/${id}/`, { status });
  }

  create(draft: OrderDraft): Observable<OrderDetail> {
    const form = new FormData();
    form.append('unidad_aplicativa', draft.unidad_aplicativa);
    form.append('direccion', draft.direccion);
    form.append('equipo', draft.equipo);
    form.append('marca', draft.marca);
    form.append('modelo', draft.modelo);
    form.append('serie', draft.serie);
    form.append('inventario', draft.inventario);
    form.append('ubicacion', draft.ubicacion);
    form.append('tipo_servicio', draft.tipo_servicio ?? '');
    form.append('procedimiento', draft.procedimiento);
    form.append('observaciones', draft.observaciones);
    form.append('client_name', draft.client_name);
    form.append('client_position', draft.client_position);
    form.append('client_accepted_terms', draft.client_accepted_terms ? 'true' : 'false');
    form.append(
      'spare_parts',
      JSON.stringify(
        draft.spare_parts.filter((sp) => sp.descripcion.trim().length > 0),
      ),
    );

    if (draft.engineer_signature) {
      form.append('engineer_signature', draft.engineer_signature, 'firma_ingeniero.png');
    }
    if (draft.client_signature) {
      form.append('client_signature', draft.client_signature, 'firma_cliente.png');
    }
    draft.photos_antes.forEach((file) => form.append('photos_antes', file, file.name));
    draft.photos_durante.forEach((file) => form.append('photos_durante', file, file.name));
    draft.photos_despues.forEach((file) => form.append('photos_despues', file, file.name));

    return this.http.post<OrderDetail>(`${this.baseUrl}/`, form);
  }

  pdfUrl(id: number | string): string {
    return `${this.baseUrl}/${id}/pdf/`;
  }

  exportXlsxUrl(filters: OrderListFilters = {}): string {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    const qs = params.toString();
    return `${this.baseUrl}/export-xlsx/${qs ? '?' + qs : ''}`;
  }
}
