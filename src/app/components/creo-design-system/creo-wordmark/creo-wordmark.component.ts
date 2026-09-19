import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creo-wordmark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creo-wordmark.component.html',
  styleUrl: './creo-wordmark.component.css'
})
export class CreoWordmarkComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() dark: boolean = false;

  get iconSize(): number {
    return this.size === 'sm' ? 16 : this.size === 'lg' ? 26 : 20;
  }

  get textClass(): string {
    return this.size === 'sm' ? 'text-base' : this.size === 'lg' ? 'text-2xl' : 'text-xl';
  }

  get gapClass(): string {
    return this.size === 'sm' ? 'gap-1.5' : this.size === 'lg' ? 'gap-2.5' : 'gap-2';
  }
}
