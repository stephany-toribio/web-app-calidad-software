import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreoChipComponent } from '../creo-chip/creo-chip.component';
import { SkillSection } from '../../../data/creo-skills.data';

@Component({
    selector: 'app-creo-skill-picker',
    standalone: true,
    imports: [CommonModule, CreoChipComponent],
    templateUrl: './creo-skill-picker.component.html',
    styleUrl: './creo-skill-picker.component.css'
})
export class CreoSkillPickerComponent {
    @Input() catalog: string[] = [];
    @Input() selected: string[] = [];
    @Input() error?: string;
    @Input() suggestedSections: SkillSection[] = [];
    /** Habilidades agrupadas por área de estudio (cada grupo se muestra como una tarjeta desplegable) */
    @Input() groupedSections: SkillSection[] = [];
    /** Cuando se define, limita el número total de habilidades seleccionables */
    @Input() maxSkills?: number;

    @Output() toggle = new EventEmitter<string>();

    query = '';

    get trimmedQuery(): string {
        return this.query.trim().toLowerCase();
    }

    get filteredCatalog(): string[] {
        return this.trimmedQuery
            ? this.catalog.filter(s => s.toLowerCase().includes(this.trimmedQuery))
            : this.catalog;
    }

    private _lastSections: SkillSection[] = [];
    private _lastCatalog: string[] = [];
    private _lastQuery = '';
    private _cachedRemaining: string[] = [];
    private _cachedSuggestedSet = new Set<string>();

    get suggestedSkillSet(): Set<string> {
        if (this._lastSections !== this.suggestedSections) {
            this._lastSections = this.suggestedSections || [];
            this._cachedSuggestedSet = new Set(this._lastSections.flatMap(s => s.skills));
        }
        return this._cachedSuggestedSet;
    }

    get remainingCatalog(): string[] {
        const fc = this.filteredCatalog;
        if (this._lastCatalog !== fc || this._lastQuery !== this.trimmedQuery || this._lastSections !== this.suggestedSections) {
            this._lastCatalog = fc;
            this._lastQuery = this.trimmedQuery;
            const set = this.suggestedSkillSet; // triggers update if needed
            this._cachedRemaining = fc.filter(s => !set.has(s));
        }
        return this._cachedRemaining;
    }

    get atMax(): boolean {
        return this.maxSkills !== undefined && this.selected.length >= this.maxSkills;
    }

    private _sectionSkillsCache = new Map<string, string[]>();

    sectionSkills(section: SkillSection): string[] {
        const key = section.label + '|' + this.trimmedQuery;
        if (!this._sectionSkillsCache.has(key)) {
            const filtered = this.trimmedQuery
                ? section.skills.filter(s => s.toLowerCase().includes(this.trimmedQuery))
                : section.skills;
            this._sectionSkillsCache.set(key, filtered);
        }
        return this._sectionSkillsCache.get(key)!;
    }

    // ── Grupos por área de estudio ────────────────────────────────────────────
    private readonly accents = ['#F2B705', '#0EA5E9', '#10B981', '#8B5CF6', '#F43F5E', '#F97316'];
    private collapsedGroups = new Set<string>();

    accent(i: number): string {
        return this.accents[i % this.accents.length];
    }

    /** Color de la franja de la cabecera: el acento con transparencia */
    tint(i: number): string {
        return this.accent(i) + '1A';
    }

    groupSkills(group: SkillSection): string[] {
        return this.trimmedQuery
            ? group.skills.filter(s => s.toLowerCase().includes(this.trimmedQuery))
            : group.skills;
    }

    selectedIn(group: SkillSection): number {
        return group.skills.filter(s => this.selected.includes(s)).length;
    }

    /** Mientras se busca, todos los grupos con resultados se muestran abiertos */
    isGroupOpen(group: SkillSection): boolean {
        return !!this.trimmedQuery || !this.collapsedGroups.has(group.label);
    }

    toggleGroup(group: SkillSection) {
        if (this.collapsedGroups.has(group.label)) {
            this.collapsedGroups.delete(group.label);
        } else {
            this.collapsedGroups.add(group.label);
        }
    }

    get hasGroups(): boolean {
        return this.groupedSections.length > 0;
    }

    get hasGroupResults(): boolean {
        return this.groupedSections.some(g => this.groupSkills(g).length > 0);
    }

    isSelected(skill: string): boolean {
        return this.selected.includes(skill);
    }

    chipDisabled(skill: string): boolean {
        return this.atMax && !this.isSelected(skill);
    }

    onQueryChange(e: Event) {
        this.query = (e.target as HTMLInputElement).value;
    }
}
