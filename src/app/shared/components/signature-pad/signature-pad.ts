import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  imports: [],
  templateUrl: './signature-pad.html',
  styleUrl: './signature-pad.css',
})
export class SignaturePad implements AfterViewInit {
  @Input() title = 'Firma';
  @Input() subtitle = 'Firme con el dedo en el área de arriba';
  @Input() confirmLabel = 'Confirmar firma';

  /** Emite el PNG de la firma confirmada como Blob, listo para mandar al
   * backend dentro del FormData de la orden. */
  @Output() confirmed = new EventEmitter<Blob>();
  @Output() cleared = new EventEmitter<void>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  hasDrawn = false;
  isConfirmed = false;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastPos: { x: number; y: number } | null = null;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.clearCanvasSurface();
  }

  private clearCanvasSurface() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private getPos(e: PointerEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  onPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.drawing = true;
    this.isConfirmed = false;
    const pos = this.getPos(e);
    this.lastPos = pos;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#272c31';
    this.ctx.fill();
  }

  onPointerMove(e: PointerEvent) {
    e.preventDefault();
    if (!this.drawing) return;
    const pos = this.getPos(e);
    if (this.lastPos) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.strokeStyle = '#272c31';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
    }
    this.lastPos = pos;
    this.hasDrawn = true;
  }

  onPointerUp() {
    this.drawing = false;
    this.lastPos = null;
  }

  clear() {
    this.clearCanvasSurface();
    this.hasDrawn = false;
    this.isConfirmed = false;
    this.cleared.emit();
  }

  confirm() {
    if (!this.hasDrawn) return;
    this.canvasRef.nativeElement.toBlob((blob) => {
      if (blob) {
        this.isConfirmed = true;
        this.confirmed.emit(blob);
      }
    }, 'image/png');
  }
}
