import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-creo-select',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creo-select.component.html',
    styleUrl: './creo-select.component.css'
})
export class CreoSelectComponent {
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