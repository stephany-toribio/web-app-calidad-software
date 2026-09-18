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
    @Input() disabled: boolean = false;

    @Output() chipClick = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();

    onClick() {
        if (this.disabled) return;
        this.chipClick.emit();
    }

    onRemoveClick(e: MouseEvent) {
        e.stopPropagation();
        this.remove.emit();
    }

    onMouseEnter(e: MouseEvent) {
        if (this.disabled || this.selected) return;
        const t = e.currentTarget as HTMLElement;
        t.style.borderColor = '#F2B705';
        t.style.color = '#111111';
        t.style.backgroundColor = '#FEF3C7';
    }

    onMouseLeave(e: MouseEvent) {
        if (this.disabled || this.selected) return;
        const t = e.currentTarget as HTMLElement;
        t.style.borderColor = '#E2E8F0';
        t.style.color = '#64748B';
        t.style.backgroundColor = '#FFFFFF';
    }
}
