import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CAREER_TAXONOMY } from '../../../../data/creo-skills.data';

export interface CareerEntry {
    area: string;
    specialty: string;
    estado: string;
    ciclo?: string;
}

export const SECUNDARIA_VALUE = 'Secundaria / Sin estudios superiores';

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
    secundariaValue = SECUNDARIA_VALUE;

    area = '';
    specialty = '';
    estado = '';
    ciclo = '';

    get isSecundaria(): boolean {
        return this.area === SECUNDARIA_VALUE;
    }

    get hasSecundaria(): boolean {
        return this.careers.some(c => c.area === SECUNDARIA_VALUE);
    }

    get specialties(): string[] {
        return (!this.isSecundaria && this.area) ? (this.taxonomy[this.area] ?? []) : [];
    }

    get showCiclo(): boolean {
        return !this.isSecundaria && (this.estado === 'Incompleta' || this.estado === 'En curso');
    }

    get canAdd(): boolean {
        if (!this.area) return false;
        return this.isSecundaria ? !this.hasSecundaria : !!(this.specialty && this.estado);
    }

    isEntrySecundaria(entry: CareerEntry): boolean {
        return entry.area === SECUNDARIA_VALUE;
    }

    onAreaChange(e: Event) {
        this.area = (e.target as HTMLSelectElement).value;
        this.specialty = '';
        this.estado = '';
        this.ciclo = '';
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

    handleAdd() {
        if (!this.area) return;

        if (this.isSecundaria) {
            if (this.hasSecundaria) return;
            this.add.emit({ area: SECUNDARIA_VALUE, specialty: '', estado: '' });
            this.area = '';
            return;
        }

        if (!this.specialty || !this.estado) return;
        const isDuplicate = this.careers.some(c => c.area === this.area && c.specialty === this.specialty);
        if (isDuplicate) return;

        const entry: CareerEntry = { area: this.area, specialty: this.specialty, estado: this.estado };
        if (this.showCiclo && this.ciclo) entry.ciclo = this.ciclo;

        this.add.emit(entry);
        this.specialty = '';
        this.estado = '';
        this.ciclo = '';
    }

    onRemove(entry: CareerEntry) {
        this.remove.emit(entry);
    }
}
