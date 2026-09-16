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

    get suggestedSkillSet(): Set<string> {
        return new Set((this.suggestedSections ?? []).flatMap(s => s.skills));
    }

    get remainingCatalog(): string[] {
        return this.filteredCatalog.filter(s => !this.suggestedSkillSet.has(s));
    }

    sectionSkills(section: SkillSection): string[] {
        return this.trimmedQuery
            ? section.skills.filter(s => s.toLowerCase().includes(this.trimmedQuery))
            : section.skills;
    }

    isSelected(skill: string): boolean {
        return this.selected.includes(skill);
    }

    onQueryChange(e: Event) {
        this.query = (e.target as HTMLInputElement).value;
    }
}