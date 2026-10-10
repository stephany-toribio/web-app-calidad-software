import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-response.model';
import { EstudioFormulario, ExperienciaFormulario, IdiomaFormulario } from './registro-candidato.mapper';

/**
 * Cuando la API rechaza (422) un valor de catálogo que el admin desactivó mientras el candidato llenaba el formulario,
 * se vacía ese campo para que lo vuelva a elegir de la lista actualizada. Lo usan el registro y el perfil.
 */

// Campos que vienen de un catálogo que el admin puede desactivar
const CAMPOS_CATALOGO_ESTUDIO = ['area_estudio_id', 'pais_id', 'institucion_id', 'carrera_id'];
const CAMPOS_CATALOGO_EXPERIENCIA = [
    'puesto_id', 'puesto_nombre', 'organizacion_id', 'organizacion_nombre', 'nivel_puesto_id', 'nivel_puesto_nombre', 'pais_id',
];

export const AVISO_LISTA_ACTUALIZADA = ' Actualizamos la lista: vuelve a elegirlo.';

// Solo los campos que se vacían: sirve tanto para los formularios del registro como para los del perfil
type EstudioCorregible = Pick<EstudioFormulario, 'areaEstudio' | 'pais' | 'institucion' | 'institucionId' | 'titulo' | 'carreraId'>;
type ExperienciaCorregible = Pick<ExperienciaFormulario, 'puesto' | 'puestoId' | 'empresa' | 'organizacionId' | 'nivel' | 'nivelId' | 'pais'>;
type IdiomaCorregible = Pick<IdiomaFormulario, 'idioma' | 'idiomaId'>;

export interface CatalogosRechazados<E, X, I> {
    estudios: E[];
    experiencias: X[];
    idiomas: I[];
    /** Qué listas hay que volver a pedir */
    recargarEstudios: boolean;
    recargarExperiencias: boolean;
    recargarIdiomas: boolean;
    recargarHabilidades: boolean;
}

/** null si el error no es un 422 sobre un campo de catálogo */
export function corregirCatalogosRechazados<E extends EstudioCorregible, X extends ExperienciaCorregible, I extends IdiomaCorregible>(
    err: HttpErrorResponse, estudios: E[], experiencias: X[], idiomas: I[],
): CatalogosRechazados<E, X, I> | null {
    if (err.status !== 422) return null;

    const campos = Object.keys((err.error as ApiError | null)?.errors ?? {});
    const resultado: CatalogosRechazados<E, X, I> = {
        estudios: [...estudios], experiencias: [...experiencias], idiomas: [...idiomas],
        recargarEstudios: false, recargarExperiencias: false, recargarIdiomas: false, recargarHabilidades: false,
    };

    for (const campo of campos) {
        const [lista, indice, atributo] = campo.split('.');
        const i = Number(indice);

        if (lista === 'estudios' && CAMPOS_CATALOGO_ESTUDIO.includes(atributo) && resultado.estudios[i]) {
            resultado.estudios[i] = vaciarCampoEstudio(resultado.estudios[i], atributo);
            resultado.recargarEstudios = true;
        } else if (lista === 'experiencias' && CAMPOS_CATALOGO_EXPERIENCIA.includes(atributo) && resultado.experiencias[i]) {
            resultado.experiencias[i] = vaciarCampoExperiencia(resultado.experiencias[i], atributo);
            resultado.recargarExperiencias = true;
        } else if (lista === 'idiomas' && atributo === 'idioma_id' && resultado.idiomas[i]) {
            // Se vacía el idioma (nombre e id): se reenviaría el mismo id y volvería a ser rechazado
            resultado.idiomas[i] = { ...resultado.idiomas[i], idioma: '', idiomaId: null };
            resultado.recargarIdiomas = true;
        } else if (lista === 'habilidades') {
            resultado.recargarHabilidades = true;
        }
    }

    const hayCorreccion = resultado.recargarEstudios || resultado.recargarExperiencias
        || resultado.recargarIdiomas || resultado.recargarHabilidades;

    return hayCorreccion ? resultado : null;
}

function vaciarCampoEstudio<E extends EstudioCorregible>(original: E, atributo: string): E {
    const estudio = { ...original };
    if (atributo === 'area_estudio_id') estudio.areaEstudio = '';
    if (atributo === 'pais_id') { estudio.pais = ''; estudio.institucion = ''; estudio.institucionId = null; }
    if (atributo === 'institucion_id') { estudio.institucion = ''; estudio.institucionId = null; }
    if (atributo === 'carrera_id') { estudio.titulo = ''; estudio.carreraId = null; }
    return estudio;
}

function vaciarCampoExperiencia<X extends ExperienciaCorregible>(original: X, atributo: string): X {
    const experiencia = { ...original };
    // Se borra también el nombre: si no, se reenviaría como valor escrito y volvería a ser rechazado
    if (atributo === 'puesto_id' || atributo === 'puesto_nombre') { experiencia.puesto = ''; experiencia.puestoId = null; }
    if (atributo === 'organizacion_id' || atributo === 'organizacion_nombre') { experiencia.empresa = ''; experiencia.organizacionId = null; }
    if (atributo === 'nivel_puesto_id' || atributo === 'nivel_puesto_nombre') { experiencia.nivel = ''; experiencia.nivelId = null; }
    if (atributo === 'pais_id') experiencia.pais = '';
    return experiencia;
}
