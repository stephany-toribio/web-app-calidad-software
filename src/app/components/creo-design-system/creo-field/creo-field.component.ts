import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creo-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creo-field.component.html',
  styleUrl: './creo-field.component.css'
})
export class CreoFieldComponent {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() error: string | undefined = undefined;
  @Input() hint: string | undefined = undefined;
  @Input() required: boolean = false;
  @Input() maxLength?: number;
  @Input() numbersOnly: boolean = false;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  onKeyPress(e: KeyboardEvent) {
    if (this.numbersOnly) {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    }
  }

  onInputChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.valueChange.emit(val);
  }

  onFocus(e: FocusEvent) {
    const el = e.currentTarget as HTMLInputElement;
    el.style.borderColor = this.error ? '#E5140D' : '#F2B705';
    el.style.boxShadow = this.error ? '0 0 0 3px rgba(229,20,13,0.12)' : '0 0 0 3px rgba(242,183,5,0.18)';
  }

  onBlur(e: FocusEvent) {
    const el = e.currentTarget as HTMLInputElement;
    el.style.borderColor = this.error ? '#E5140D' : '#E2E8F0';
    el.style.boxShadow = 'none';
  }
}
