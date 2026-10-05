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
