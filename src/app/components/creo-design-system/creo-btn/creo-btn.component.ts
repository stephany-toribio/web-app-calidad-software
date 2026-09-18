import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creo-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creo-btn.component.html',
  styleUrl: './creo-btn.component.css'
})
export class CreoBtnComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() className: string = '';

  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    };
    return [base, sizes[this.size], this.fullWidth ? 'w-full' : '', this.className].filter(Boolean).join(' ');
  }

  get bgStyle(): string {
    if (this.variant === 'primary') return '#F2B705';
    if (this.variant === 'secondary') return '#FFFFFF';
    return 'transparent';
  }

  get colorStyle(): string {
    return '#111111';
  }

  get borderStyle(): string {
    return this.variant === 'secondary' ? '1.5px solid #E2E8F0' : 'none';
  }

  onMouseEnter(e: MouseEvent) {
    const t = e.currentTarget as HTMLButtonElement;
    if (this.disabled || this.loading) return;
    if (this.variant === 'primary') t.style.backgroundColor = '#D9A204';
    if (this.variant === 'secondary' || this.variant === 'ghost') t.style.backgroundColor = '#F8FAFC';
  }

  onMouseLeave(e: MouseEvent) {
    const t = e.currentTarget as HTMLButtonElement;
    if (this.disabled || this.loading) return;
    if (this.variant === 'primary') t.style.backgroundColor = '#F2B705';
    if (this.variant === 'secondary') t.style.backgroundColor = '#FFFFFF';
    if (this.variant === 'ghost') t.style.backgroundColor = 'transparent';
  }
}
