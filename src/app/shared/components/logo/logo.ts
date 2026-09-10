import { Component, input } from '@angular/core';

/**
 * Logo de TAGLMON para uso dentro de la interfaz (login, header, etc).
 * Fuente de la imagen: carpeta Logos/taglmon_logo.webp del proyecto.
 */
@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  /** Alto del logo en px. Ajustable según el contexto (login vs header). */
  readonly heightPx = input<number>(40);
}
