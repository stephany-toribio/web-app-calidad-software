import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreoBtnComponent } from '../../../../components/creo-design-system/creo-btn/creo-btn.component';

export interface LanguageEntry {
  idioma: string;
  nivelEscrito: string;
  nivelOral: string;
}

const IDIOMAS = ['Inglés', 'Español', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Otro'];
const NIVELES = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];

@Component({
  selector: 'app-language-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoBtnComponent],
  templateUrl: './language-list.component.html',
})
export class LanguageListComponent {
  @Input() languages: LanguageEntry[] = [];
  @Input() maxLanguages: number = 10;
  @Output() languagesChange = new EventEmitter<LanguageEntry[]>();

  showModal = false;
  
  idiomas = IDIOMAS;
  niveles = NIVELES;

  editingIndex = -1;
  currentLang: LanguageEntry = this.getEmptyLang();
  errors: Record<string, string> = {};

  getEmptyLang(): LanguageEntry {
    return { idioma: '', nivelEscrito: '', nivelOral: '' };
  }

  openModal(index = -1) {
    this.errors = {};
    this.editingIndex = index;
    if (index === -1) {
      this.currentLang = this.getEmptyLang();
    } else {
      this.currentLang = { ...this.languages[index] };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  removeLanguage(index: number, event: Event) {
    event.stopPropagation();
    const newList = [...this.languages];
    newList.splice(index, 1);
    this.languagesChange.emit(newList);
  }

  saveLanguage() {
    this.errors = {};
    if (!this.currentLang.idioma) this.errors['idioma'] = 'Requerido';
    if (!this.currentLang.nivelEscrito) this.errors['nivelEscrito'] = 'Requerido';
    if (!this.currentLang.nivelOral) this.errors['nivelOral'] = 'Requerido';

    if (Object.keys(this.errors).length === 0) {
      const updated = [...this.languages];
      if (this.editingIndex === -1) {
        updated.push(this.currentLang);
      } else {
        updated[this.editingIndex] = this.currentLang;
      }
      this.languagesChange.emit(updated);
      this.closeModal();
    }
  }
}
