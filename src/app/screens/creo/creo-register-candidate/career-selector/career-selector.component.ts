import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CAREER_TAXONOMY } from '../../../../data/creo-skills.data';

@Component({
    selector: 'app-career-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './career-selector.component.html',
    styleUrl: './career-selector.component.css'
})
export class CareerSelectorComponent {
    @Input() careers: string[] = [];
    @Input() error?: string;

    @Output() add = new EventEmitter<string>();
    @Output() remove = new EventEmitter<string>();

    taxonomy = CAREER_TAXONOMY;
    areas = Object.keys(CAREER_TAXONOMY);

    area = '';
    specialty = '';

    get specialties(): string[] {
        return this.area ? (this.taxonomy[this.area] ?? []) : [];
    }

    onAreaChange(e: Event) {
        this.area = (e.target as HTMLSelectElement).value;
        this.specialty = '';
    }

    onSpecialtyChange(e: Event) {
        this.specialty = (e.target as HTMLSelectElement).value;
    }

    handleAdd() {
        if (!this.area || !this.specialty) return;
        const chip = `${this.area} · ${this.specialty}`;
        if (!this.careers.includes(chip)) this.add.emit(chip);
        this.specialty = '';
    }
}