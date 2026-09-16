import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-creo-chip',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creo-chip.component.html',
    styleUrl: './creo-chip.component.css'
})
export class CreoChipComponent {
    @Input() label: string = '';
    @Input() selected: boolean = false;
    @Input() removable: boolean = false;

    @Output() chipClick = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();

    onRemoveClick(e: MouseEvent) {
        e.stopPropagation();
        this.remove.emit();
    }
}