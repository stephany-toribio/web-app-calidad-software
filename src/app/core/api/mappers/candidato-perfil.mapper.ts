import { CandidatoPerfil, EstudioPerfil, ExperienciaPerfil, IdiomaPerfil } from '../models/candidato-perfil.model';
import { RegistroCandidatoPayload } from '../models/registro-candidato.model';
import {
    ESTADOS, EstudioFormulario, ExperienciaFormulario, IdiomaFormulario, MESES,
    NIVELES_IDIOMA,
} from './registro-candidato.mapper';

// Traducción inversa a la del registro: respuesta de la API 
export interface PerfilVista {
    initials: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string;
    birthDate: string;
    hardSkills: string[];
    softSkills: string[];
    experience: ExperienciaFormulario[];
    education: EstudioFormulario[];
    languages: IdiomaFormulario[];
}


const invertir = <T extends string>(r: Record<string, T>) =>
    Object.fromEntries(Object.entries(r).map(([texto, valor]) => [valor, texto])) as Record<T, string>;

const ESTADO_TEXTO = invertir(ESTADOS);
const NIVEL_IDIOMA_TEXTO = invertir(NIVELES_IDIOMA);


function mesAnio(fecha: string | null): { mes: string; anio: string } {
    if (!fecha) return { mes: '', anio: '' };
    const [anio, mes] = fecha.split('-');
    return { mes: MESES[+mes - 1] ?? '', anio };
}

export function perfilDesdeApi(c: CandidatoPerfil): PerfilVista {
    return {
        initials: ((c.nombre?.charAt(0) ?? '') + (c.apellidos?.charAt(0) ?? '')).toUpperCase(),
        name: `${c.nombre} ${c.apellidos}`.trim(),
        firstName: c.nombre,
        lastName: c.apellidos,
        email: c.correo,
        phone: c.celular,
        dni: c.dni,
        birthDate: c.fecha_nacimiento,
        hardSkills: c.habilidades.filter(h => h.tipo_habilidad === 'tecnica').map(h => h.nombre),
        softSkills: c.habilidades.filter(h => h.tipo_habilidad === 'blanda').map(h => h.nombre),
        experience: c.experiencias.map(experienciaDesdeApi),
        education: c.estudios.map(estudioDesdeApi),
        languages: c.idiomas.map(idiomaDesdeApi),
    };
}

/**  PUT /candidatos/me. El correo no va: pertenece a usuarios (módulo Auth) */
export interface DatosPerfilFormulario {
    firstName: string; lastName: string; dni: string; birthDate: string; phone: string;
}

export function payloadDatosPerfil(f: DatosPerfilFormulario): Partial<RegistroCandidatoPayload> {
    return {
        nombre: f.firstName.trim(),
        apellidos: f.lastName.trim(),
        dni: f.dni.trim(),
        fecha_nacimiento: f.birthDate,
        celular: f.phone.trim(),
    };
}

function estudioDesdeApi(e: EstudioPerfil): EstudioFormulario {
    const inicio = mesAnio(e.fecha_inicio);
    const fin = mesAnio(e.fecha_fin);

    return {
        tipoEstudio: e.tipo_estudio?.nombre ?? '',
        areaEstudio: e.area_estudio?.nombre ?? '',
        pais: e.pais?.nombre ?? '',
        institucion: e.institucion?.nombre ?? '',
        titulo: e.carrera?.nombre ?? '',
        institucionId: e.institucion?.id ?? null,
        carreraId: e.carrera?.id ?? null,
        estado: e.estado ? (ESTADO_TEXTO[e.estado] ?? e.estado) : '',
        fechaInicioMes: inicio.mes, fechaInicioAno: inicio.anio,
        fechaFinMes: fin.mes, fechaFinAno: fin.anio,
        // "Sin estudios formales" no tiene fechas: no es "al presente"
        alPresente: e.fecha_inicio !== null && e.fecha_fin === null,
    };
}

function idiomaDesdeApi(i: IdiomaPerfil): IdiomaFormulario {
    return {
        idioma: i.idioma?.nombre ?? '',
        idiomaId: i.idioma?.id ?? null,
        nivelEscrito: NIVEL_IDIOMA_TEXTO[i.nivel_escrito] ?? i.nivel_escrito,
        nivelOral: NIVEL_IDIOMA_TEXTO[i.nivel_oral] ?? i.nivel_oral,
    };
}

function experienciaDesdeApi(e: ExperienciaPerfil): ExperienciaFormulario {
    const inicio = mesAnio(e.fecha_inicio);
    const fin = mesAnio(e.fecha_fin);

    return {
        puesto: e.puesto?.nombre ?? '',
        empresa: e.organizacion?.nombre ?? '',
        puestoId: e.puesto?.id ?? null,
        puestoPersonalizado: e.puesto?.personalizado ?? false,
        puestoActivo: e.puesto?.activo ?? true,
        organizacionPersonalizada: e.organizacion?.personalizado ?? false,
        organizacionActiva: e.organizacion?.activo ?? true,
        organizacionId: e.organizacion?.id ?? null,
        pais: e.pais?.nombre ?? '',
        nivel: e.nivel?.nombre ?? '',
        nivelId: e.nivel?.id ?? null,
        nivelPersonalizado: e.nivel?.personalizado ?? false,
        nivelActivo: e.nivel?.activo ?? true,
        descripcion: e.descripcion ?? '',
        fechaInicioMes: inicio.mes, fechaInicioAno: inicio.anio,
        fechaFinMes: fin.mes, fechaFinAno: fin.anio,
        alPresente: e.fecha_fin === null,
    };
}
