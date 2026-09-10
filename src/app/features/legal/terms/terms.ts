import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-terms',
  imports: [CommonModule, RouterLink, Logo],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {
  lastUpdated = 'agosto de 2026';
}
