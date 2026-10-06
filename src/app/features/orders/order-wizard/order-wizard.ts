import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';
import { SignaturePad } from '../../../shared/components/signature-pad/signature-pad';
import { Auth } from '../../../core/services/auth';
import { Orders } from '../../../core/services/orders';
import {
  OrderDraft,
  PhotoPhase,
  ServiceType,
  SparePartInput,
  emptyOrderDraft,
} from '../../../core/models/order.model';

interface StepDef {
  id: number;
  title: string;
}

const STEPS: StepDef[] = [
  { id: 1, title: 'Datos generales' },
  { id: 2, title: 'Tipo de servicio' },
  { id: 3, title: 'Procedimiento' },
  { id: 4, title: 'Observaciones y refacciones' },
  { id: 5, title: 'Fotografías' },
  { id: 6, title: 'Firma del ingeniero' },
  { id: 7, title: 'Firma del responsable' },
  { id: 8, title: 'Revisión y envío' },
];

const SERVICE_TYPES: { id: ServiceType; label: string; desc: string }[] = [
  { id: 'preventivo', label: 'Preventivo', desc: 'Mantenimiento programado' },
  { id: 'correctivo', label: 'Correctivo', desc: 'Reparación de falla' },
  { id: 'diagnostico', label: 'Diagnóstico', desc: 'Evaluación de equipo' },
  { id: 'instalacion', label: 'Instalación', desc: 'Puesta en marcha' },
  { id: 'otro', label: 'Otro', desc: 'Otro tipo de servicio' },
];

const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_TYPES.map((s) => [s.id, s.label]),
);

/** Debe coincidir con ORDER_MAX_PHOTOS_PER_PHASE del backend. */
export const MAX_PHOTOS_PER_PHASE = 10;

interface PhotoPreview {
  file: File;
  url: string;
}

/** Convierte la respuesta de error del backend en un mensaje legible. DRF
 * regresa {"detail": "..."} o {"campo": ["mensaje", ...]} por campo. */
function submitErrorMessage(err: any): string {
  const fallback = 'No se pudo enviar la orden. Verifica los datos e intenta de nuevo.';
  if (err?.status === 0) return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  const body = err?.error;
  if (!body || typeof body !== 'object') return fallback;
  if (typeof body.detail === 'string') return body.detail;
  for (const messages of Object.values(body)) {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (typeof first === 'string') return first;
  }
  return fallback;
}

@Component({
  selector: 'app-order-wizard',
  imports: [CommonModule, FormsModule, RouterLink, Logo, SignaturePad],
  templateUrl: './order-wizard.html',
  styleUrl: './order-wizard.css',
})
export class OrderWizard {
  readonly steps = STEPS;
  readonly serviceTypes = SERVICE_TYPES;
  readonly serviceLabels = SERVICE_LABELS;
  readonly maxPhotos = MAX_PHOTOS_PER_PHASE;

  step = signal(1);
  draft = signal<OrderDraft>(emptyOrderDraft());

  submitting = signal(false);
  submitError = signal<string | null>(null);
  photoLimitPhase = signal<PhotoPhase | null>(null);

  // Previews (no se mandan al backend, solo para mostrar en pantalla)
  photoPreviews = signal<Record<PhotoPhase, PhotoPreview[]>>({
    ANTES: [],
    DURANTE: [],
    DESPUES: [],
  });
  engineerSignaturePreview = signal<string | null>(null);
  clientSignaturePreview = signal<string | null>(null);

  progress = computed(() => (this.step() - 1) / (this.steps.length - 1));
  currentStepTitle = computed(() => this.steps[this.step() - 1]?.title ?? '');

  constructor(
    private readonly auth: Auth,
    private readonly ordersService: Orders,
    private readonly router: Router,
  ) {}

  today(): string {
    return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  get engineerName(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  }

  updateField<K extends keyof OrderDraft>(field: K, value: OrderDraft[K]) {
    this.draft.update((d) => ({ ...d, [field]: value }));
  }

  selectServiceType(id: ServiceType) {
    this.updateField('tipo_servicio', id);
  }

  // --- Refacciones ---
  addSparePart() {
    this.draft.update((d) => ({
      ...d,
      spare_parts: [...d.spare_parts, { codigo: '', descripcion: '', cantidad: 1 }],
    }));
  }

  updateSparePart(index: number, patch: Partial<SparePartInput>) {
    this.draft.update((d) => ({
      ...d,
      spare_parts: d.spare_parts.map((sp, i) => (i === index ? { ...sp, ...patch } : sp)),
    }));
  }

  removeSparePart(index: number) {
    this.draft.update((d) => ({
      ...d,
      spare_parts: d.spare_parts.filter((_, i) => i !== index),
    }));
  }

  // --- Fotos ---
  onPhotoSelected(phase: PhotoPhase, event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const available = MAX_PHOTOS_PER_PHASE - this.photoCount(phase);
    const selected = Array.from(files);
    const newFiles = selected.slice(0, Math.max(available, 0));
    this.photoLimitPhase.set(selected.length > newFiles.length ? phase : null);
    input.value = '';
    if (newFiles.length === 0) return;

    const key = phase === 'ANTES' ? 'photos_antes' : phase === 'DURANTE' ? 'photos_durante' : 'photos_despues';
    this.draft.update((d) => ({ ...d, [key]: [...d[key], ...newFiles] }));

    this.photoPreviews.update((previews) => ({
      ...previews,
      [phase]: [
        ...previews[phase],
        ...newFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ],
    }));
  }

  removePhoto(phase: PhotoPhase, index: number) {
    if (this.photoLimitPhase() === phase) this.photoLimitPhase.set(null);
    const key = phase === 'ANTES' ? 'photos_antes' : phase === 'DURANTE' ? 'photos_durante' : 'photos_despues';
    this.draft.update((d) => ({
      ...d,
      [key]: d[key].filter((_, i) => i !== index),
    }));
    this.photoPreviews.update((previews) => {
      const removed = previews[phase][index];
      if (removed) URL.revokeObjectURL(removed.url);
      return { ...previews, [phase]: previews[phase].filter((_, i) => i !== index) };
    });
  }

  photoCount(phase: PhotoPhase): number {
    return this.photoPreviews()[phase].length;
  }

  previewsFor(phase: PhotoPhase): PhotoPreview[] {
    return this.photoPreviews()[phase];
  }

  // --- Firmas ---
  onEngineerSignatureConfirmed(blob: Blob) {
    this.updateField('engineer_signature', blob);
    if (this.engineerSignaturePreview()) URL.revokeObjectURL(this.engineerSignaturePreview()!);
    this.engineerSignaturePreview.set(URL.createObjectURL(blob));
  }

  onEngineerSignatureCleared() {
    this.updateField('engineer_signature', null);
    if (this.engineerSignaturePreview()) URL.revokeObjectURL(this.engineerSignaturePreview()!);
    this.engineerSignaturePreview.set(null);
  }

  onClientSignatureConfirmed(blob: Blob) {
    this.updateField('client_signature', blob);
    if (this.clientSignaturePreview()) URL.revokeObjectURL(this.clientSignaturePreview()!);
    this.clientSignaturePreview.set(URL.createObjectURL(blob));
  }

  onClientSignatureCleared() {
    this.updateField('client_signature', null);
    if (this.clientSignaturePreview()) URL.revokeObjectURL(this.clientSignaturePreview()!);
    this.clientSignaturePreview.set(null);
  }

  // --- Validación de cada paso ---
  canProceed(): boolean {
    const d = this.draft();
    switch (this.step()) {
      case 1:
        return d.unidad_aplicativa.trim().length > 0 && d.equipo.trim().length > 0 && d.marca.trim().length > 0;
      case 2:
        return d.tipo_servicio !== null;
      case 3:
        return d.procedimiento.trim().length >= 10;
      case 6:
        return d.engineer_signature !== null;
      case 7:
        return (
          d.client_name.trim().length > 0 &&
          d.client_position.trim().length > 0 &&
          d.client_signature !== null &&
          d.client_accepted_terms
        );
      default:
        return true;
    }
  }

  next() {
    if (!this.canProceed()) return;
    if (this.step() < this.steps.length) {
      this.step.update((s) => s + 1);
      window.scrollTo({ top: 0 });
    } else {
      this.submit();
    }
  }

  prev() {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
      window.scrollTo({ top: 0 });
    } else {
      this.router.navigateByUrl('/ingeniero/inicio');
    }
  }

  get nextLabel(): string {
    if (this.step() === this.steps.length) return this.submitting() ? 'Enviando...' : 'Enviar orden';
    if (this.step() === this.steps.length - 1) return 'Revisar orden';
    return 'Siguiente';
  }

  submit() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);

    this.ordersService.create(this.draft()).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.router.navigate(['/ordenes', order.id, 'enviada']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(submitErrorMessage(err));
      },
    });
  }
}
