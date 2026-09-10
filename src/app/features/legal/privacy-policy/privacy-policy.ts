import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-privacy-policy',
  imports: [CommonModule, RouterLink, Logo],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
})
export class PrivacyPolicy {
  lastUpdated = 'agosto de 2026';
}
