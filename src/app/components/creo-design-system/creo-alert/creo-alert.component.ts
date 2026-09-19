import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creo-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creo-alert.component.html',
  styleUrl: './creo-alert.component.css'
})
export class CreoAlertComponent {
  @Input() type: 'error' | 'success' | 'info' = 'info';
  @Input() message: string = '';

  get cfg() {
    if (this.type === 'error') {
      return { bg: '#FEF2F2', border: '#E5140D', text: '#E5140D', iconStroke: '#E5140D' };
    }
    if (this.type === 'success') {
      return { bg: '#FEF3C7', border: '#F2B705', text: '#111111', iconStroke: '#D9A204' };
    }
    return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', iconStroke: '#94A3B8' };
  }
}
