import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

let nextControlId = 0;

@Component({
    selector: 'app-creo-select',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creo-select.component.html',
    styleUrl: './creo-select.component.css'
})
export class CreoSelectComponent {
  @Input() testId = '';
  @Input() autocomplete = 'off';
  private readonly fallbackId = 'creo-control-' + 'creo-select-' + ++nextControlId;
  get controlId(): string { return this.testId ? 'creo-' + this.testId : this.fallbackId; }
  get descriptionId(): string | null {
    return this.error ? this.controlId + '-error' : null;
  }
    @Input() label: string = '';
    @Input() value: string = '';
    @Input() options: string[] = [];
    @Input() placeholder: string = 'Seleccionar…';
    @Input() error?: string;
    @Input() required: boolean = false;

    @Output() valueChange = new EventEmitter<string>();

    onChange(e: Event) {
        this.valueChange.emit((e.target as HTMLSelectElement).value);
    }
}