import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CAREER_TAXONOMY, CareerEntry } from '../../../../data/creo-skills.data';

const ESTADO_OPTIONS = ['Finalizado', 'Incompleta', 'En curso'];
const CICLO_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

@Component({
    selector: 'app-career-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './career-selector.component.html',
    styleUrl: './career-selector.component.css'
})
export class CareerSelectorComponent {
    @Input() careers: CareerEntry[] = [];
    @Input() error?: string;

    @Output() add = new EventEmitter<CareerEntry>();
    @Output() remove = new EventEmitter<CareerEntry>();

    taxonomy = CAREER_TAXONOMY;
    areas = Object.keys(CAREER_TAXONOMY);
    estadoOptions = ESTADO_OPTIONS;
    cicloOptions = CICLO_OPTIONS;

    area = '';
    specialty = '';
    estado = '';
    ciclo = '';

    get specialties(): string[] {
        return this.area ? (this.taxonomy[this.area] ?? []) : [];
    }

    get showCiclo(): boolean {
        return this.estado === 'Incompleta' || this.estado === 'En curso';
    }

    onAreaChange(e: Event) {
        this.area = (e.target as HTMLSelectElement).value;
        this.specialty = '';
    }

    onSpecialtyChange(e: Event) {
        this.specialty = (e.target as HTMLSelectElement).value;
    }

    onEstadoChange(e: Event) {
        this.estado = (e.target as HTMLSelectElement).value;
        this.ciclo = '';
    }

    onCicloChange(e: Event) {
        this.ciclo = (e.target as HTMLSelectElement).value;
    }

    get canAdd(): boolean {
        return !!(this.area && this.specialty && this.estado);
    }

    handleAdd() {
        if (!this.canAdd) return;
        const isDuplicate = this.careers.some(c => c.area === this.area && c.specialty === this.specialty);
        if (isDuplicate) return;

        const entry: CareerEntry = { area: this.area, specialty: this.specialty, estado: this.estado };
        if (this.showCiclo && this.ciclo) entry.ciclo = this.ciclo;

        this.add.emit(entry);
        this.specialty = '';
        this.estado = '';
        this.ciclo = '';
    }
}