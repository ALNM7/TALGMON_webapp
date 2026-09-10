export type ServiceType = 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'otro';
export type OrderStatus = 'pendiente' | 'en_proceso' | 'completado';
export type PhotoPhase = 'ANTES' | 'DURANTE' | 'DESPUES';

export interface SparePartInput {
  codigo: string;
  descripcion: string;
  cantidad: number;
}

export interface SparePart extends SparePartInput {
  id: number;
}

export interface OrderPhoto {
  id: number;
  phase: PhotoPhase;
  image: string;
  uploaded_at: string;
}

export interface OrderEngineer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
}

export interface OrderListItem {
  id: number;
  folio: string;
  created_at: string;
  engineer: OrderEngineer;
  unidad_aplicativa: string;
  equipo: string;
  marca: string;
  modelo: string;
  tipo_servicio: ServiceType;
  tipo_servicio_display: string;
  status: OrderStatus;
  status_display: string;
}

export interface OrderDetail extends OrderListItem {
  updated_at: string;
  direccion: string;
  serie: string;
  inventario: string;
  ubicacion: string;
  procedimiento: string;
  observaciones: string;
  spare_parts: SparePart[];
  photos: OrderPhoto[];
  client_name: string;
  client_position: string;
  client_accepted_terms: boolean;
  client_accepted_terms_at: string | null;
  engineer_signature: string;
  client_signature: string;
  pdf_file: string | null;
}

/** Estado que vive en el wizard mientras el ingeniero llena el formulario,
 * antes de mandarlo al backend. Las fotos/firmas se guardan como
 * File/Blob en memoria (nunca en localStorage). */
export interface OrderDraft {
  unidad_aplicativa: string;
  direccion: string;
  equipo: string;
  marca: string;
  modelo: string;
  serie: string;
  inventario: string;
  ubicacion: string;
  tipo_servicio: ServiceType | null;
  procedimiento: string;
  observaciones: string;
  spare_parts: SparePartInput[];
  photos_antes: File[];
  photos_durante: File[];
  photos_despues: File[];
  engineer_signature: Blob | null;
  client_signature: Blob | null;
  client_name: string;
  client_position: string;
  client_accepted_terms: boolean;
}

export function emptyOrderDraft(): OrderDraft {
  return {
    unidad_aplicativa: '',
    direccion: '',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: '',
    ubicacion: '',
    tipo_servicio: null,
    procedimiento: '',
    observaciones: '',
    spare_parts: [],
    photos_antes: [],
    photos_durante: [],
    photos_despues: [],
    engineer_signature: null,
    client_signature: null,
    client_name: '',
    client_position: '',
    client_accepted_terms: false,
  };
}
