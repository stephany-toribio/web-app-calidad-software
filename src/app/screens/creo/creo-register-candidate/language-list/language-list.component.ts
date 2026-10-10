import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreoBtnComponent } from '../../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CatalogosService } from '../../../../core/api/catalogos.service';
import { ItemCatalogo } from '../../../../core/api/models/catalogos.model';
import { aId } from '../../../../core/api/mappers/registro-candidato.mapper';

export interface LanguageEntry {
  idioma: string;
  nivelEscrito: string;
  nivelOral: string;
  // id del catálogo: permite conservar un idioma que el admin desactivó después (ya no viene en la lista)
  idiomaId?: number | null;
}

const NIVELES = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];

@Component({
  selector: 'app-language-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoBtnComponent],
  templateUrl: './language-list.component.html',
})
export class LanguageListComponent implements OnInit {
  private catalogos = inject(CatalogosService);

  @Input() languages: LanguageEntry[] = [];
  @Input() maxLanguages: number = 10;
  @Output() languagesChange = new EventEmitter<LanguageEntry[]>();

  showModal = false;

  idiomas: string[] = [];
  private catalogoIdiomas: ItemCatalogo[] = [];
  niveles = NIVELES;

  editingIndex = -1;
  currentLang: LanguageEntry = this.getEmptyLang();
  errors: Record<string, string> = {};

  showIdiomas = false;

  ngOnInit() {
    this.recargarCatalogos();
  }

  /** Pide la lista actual. El registro y el perfil la vuelven a llamar si la API rechaza un idioma desactivado */
  recargarCatalogos() {
    this.catalogos.idiomas().subscribe(lista => {
      this.catalogoIdiomas = lista;
      this.idiomas = lista.map(i => i.nombre);
    });
  }

  get filteredIdiomas(): string[] {
    const val = (this.currentLang.idioma || '').toLowerCase();
    const usados = new Set(
      this.languages
        .filter((_, i) => i !== this.editingIndex)
        .map(l => l.idioma.toLowerCase())
    );
    return this.idiomas
      .filter(i => !usados.has(i.toLowerCase()))
      .filter(i => i.toLowerCase().includes(val));
  }

  onIdiomaChange(val: string) {
    this.currentLang.idioma = val;
    this.currentLang.idiomaId = null;            // escrito a mano: hay que elegirlo de la lista
    this.showIdiomas = true;
  }

  selectIdioma(idioma: string) {
    this.currentLang.idioma = idioma;
    this.currentLang.idiomaId = aId(this.catalogoIdiomas, idioma);
    this.showIdiomas = false;
  }

  onIdiomaBlur() {
    setTimeout(() => {
      this.showIdiomas = false;
    }, 200);
  }

  /** Idiomas que aún no se han agregado (más el que está seleccionado actualmente, si se está editando). */
  get availableIdiomas(): string[] {
    const usados = new Set(
      this.languages
        .filter((_, i) => i !== this.editingIndex)
        .map(l => l.idioma)
    );
    return this.idiomas.filter(i => !usados.has(i));
  }

  getEmptyLang(): LanguageEntry {
    return { idioma: '', nivelEscrito: '', nivelOral: '', idiomaId: null };
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
    if (!this.currentLang.idioma.trim()) this.errors['idioma'] = 'Requerido';
    // Solo idiomas del catálogo: el backend necesita su id. Con idiomaId se conserva uno que ya tenía (aunque esté desactivado)
    else if (!this.currentLang.idiomaId && aId(this.catalogoIdiomas, this.currentLang.idioma) === null) this.errors['idioma'] = 'Elige un idioma de la lista';
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
