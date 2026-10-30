import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Convierte un subconjunto de Markdown en HTML para mostrar descripciones con formato.
 *
 * Seguridad: el texto se escapa ANTES de convertirlo, así que lo que escriba la
 * empresa nunca puede inyectar etiquetas ni scripts. El HTML final lo construye
 * solo este pipe, por eso es seguro marcarlo como confiable.
 *
 * Admite: títulos (#, ##, ###), listas (- o *), listas numeradas (1.),
 * **negrita**, *cursiva*, `código`, saltos de línea y párrafos.
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(texto: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.convertir(texto ?? ''));
  }

  /** Neutraliza cualquier HTML que venga en el texto original */
  private escapar(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Marcas que funcionan dentro de una línea */
  private enLinea(texto: string): string {
    return texto
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 text-[0.9em]">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  private convertir(original: string): string {
    const lineas = this.escapar(original).split(/\r?\n/);
    const html: string[] = [];

    let lista: 'ul' | 'ol' | null = null;
    let parrafo: string[] = [];

    const cerrarParrafo = () => {
      if (parrafo.length === 0) return;
      // Un salto simple dentro del párrafo se respeta como salto de línea
      html.push(`<p>${this.enLinea(parrafo.join('<br>'))}</p>`);
      parrafo = [];
    };

    const cerrarLista = () => {
      if (!lista) return;
      html.push(`</${lista}>`);
      lista = null;
    };

    for (const cruda of lineas) {
      const linea = cruda.trim();

      if (!linea) {
        cerrarParrafo();
        cerrarLista();
        continue;
      }

      const titulo = linea.match(/^(#{1,3})\s+(.*)$/);
      if (titulo) {
        cerrarParrafo();
        cerrarLista();
        const nivel = titulo[1].length;
        const tamano = nivel === 1 ? 'text-base' : nivel === 2 ? 'text-sm' : 'text-xs';
        html.push(`<h${nivel + 2} class="${tamano} font-bold mt-3 first:mt-0">${this.enLinea(titulo[2])}</h${nivel + 2}>`);
        continue;
      }

      const vineta = linea.match(/^[-*]\s+(.*)$/);
      if (vineta) {
        cerrarParrafo();
        if (lista !== 'ul') {
          cerrarLista();
          html.push('<ul class="list-disc pl-5 space-y-1 my-2">');
          lista = 'ul';
        }
        html.push(`<li>${this.enLinea(vineta[1])}</li>`);
        continue;
      }

      const numerada = linea.match(/^\d+[.)]\s+(.*)$/);
      if (numerada) {
        cerrarParrafo();
        if (lista !== 'ol') {
          cerrarLista();
          html.push('<ol class="list-decimal pl-5 space-y-1 my-2">');
          lista = 'ol';
        }
        html.push(`<li>${this.enLinea(numerada[1])}</li>`);
        continue;
      }

      cerrarLista();
      parrafo.push(linea);
    }

    cerrarParrafo();
    cerrarLista();

    return html.join('');
  }
}
