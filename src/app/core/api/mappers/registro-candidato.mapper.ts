import { AreaEstudio, Habilidad, ItemCatalogo, TipoEstudio } from '../models/catalogos.model';
import {
    EstadoEstudio, EstudioPayload, ExperienciaPayload, Genero, IdiomaPayload,
    NivelExperiencia, NivelIdioma, RegistroCandidatoPayload,
} from '../models/registro-candidato.model';
// Datos del formulario (misma forma que el componente y sus subcomponentes).
export interface DatosPersonalesFormulario {
    firstName: string; lastName: string;
    birthDay: string; birthMonth: string; birthYear: string;
    dni: string; gender: string; email: string; password: string; passwordConfirm: string; phone: string;
}

export interface EstudioFormulario {
    tipoEstudio: string; areaEstudio: string; pais: string;
    institucion: string; titulo: string;
    institucionId?: number | null; carreraId?: number | null;
    estado: string;
    fechaInicioMes: string; fechaInicioAno: string;
    fechaFinMes: string; fechaFinAno: string; alPresente: boolean;
}

export interface IdiomaFormulario { idioma: string; nivelEscrito: string; nivelOral: string; }

export interface ExperienciaFormulario {
    puesto: string; empresa: string; pais: string; nivel: string; descripcion: string;
    puestoId?: number | null; organizacionId?: number | null;
    // Solo lectura, vienen del perfil: puesto escrito por el candidato / deshabilitado por el admin
    puestoPersonalizado?: boolean; puestoActivo?: boolean;
    fechaInicioMes: string; fechaInicioAno: string;
    fechaFinMes: string; fechaFinAno: string; alPresente: boolean;
}

/** Catálogos ya cargados desde la API, para convertir nombres en IDs */
export interface CatalogosRegistro {
    paises: ItemCatalogo[];
    tiposEstudio: TipoEstudio[];
    areasEstudio: AreaEstudio[];
    idiomas: ItemCatalogo[];
    puestos: ItemCatalogo[];
    habilidades: Habilidad[];
}


// Conversiones de valores (textos del formulario → valores del backend)
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ESTADOS: Record<string, EstadoEstudio> = {
    'Finalizado': 'finalizado', 'En curso': 'en_curso', 'Incompleto': 'incompleto',
};

export const NIVELES_IDIOMA: Record<string, NivelIdioma> = {
    'Básico': 'basico', 'Intermedio': 'intermedio', 'Avanzado': 'avanzado', 'Nativo': 'nativo',
};

export const NIVELES_EXPERIENCIA: Record<string, NivelExperiencia> = {
    'Trainee': 'trainee', 'Junior': 'junior', 'Semi Senior': 'semi_senior', 'Senior': 'senior',
    'Jefe / Supervisor': 'jefe_supervisor', 'Gerente / Director': 'gerente_director',
};

const normalizar = (texto: string) => (texto ?? '').trim().toLowerCase();
const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Busca el ID por nombre en un catálogo cargado. null si no existe (el backend responde 422) */
export function aId(catalogo: ItemCatalogo[], nombre: string): number | null {
    return catalogo.find(item => normalizar(item.nombre) === normalizar(nombre))?.id ?? null;
}

/** 15 / 'May' / 1995 → '1995-05-15' */
export function fechaNacimiento(dia: string, mesCorto: string, anio: string): string {
    const mes = MESES_CORTOS.indexOf(mesCorto) + 1;
    return dia && mes && anio ? `${anio}-${dosDigitos(mes)}-${dosDigitos(+dia)}` : '';
}

/** 'Marzo' / 2019 → '2019-03-01'. Sin mes o año → null */
export function fechaMesAnio(mes: string, anio: string): string | null {
    const numero = MESES.indexOf(mes) + 1;
    return numero && anio ? `${anio}-${dosDigitos(numero)}-01` : null;
}

export function genero(texto: string): Genero | null {
    return texto ? (normalizar(texto) as Genero) : null;   // 'Prefiero no decir' → 'prefiero no decir'
}


// Payload de cada paso lo que se envía con Precognition y el completo 


/** Paso 0 — Cuenta y datos personales */
export function payloadDatosPersonales(f: DatosPersonalesFormulario): Partial<RegistroCandidatoPayload> {
    return {
        nombre: f.firstName.trim(),
        apellidos: f.lastName.trim(),
        dni: f.dni,
        fecha_nacimiento: fechaNacimiento(f.birthDay, f.birthMonth, f.birthYear),
        genero: genero(f.gender),
        celular: f.phone,
        correo: f.email.trim(),
        password: f.password,
        password_confirmation: f.passwordConfirm,
    };
}

/** Paso 1 — Estudios e idiomas */
export function payloadEstudiosIdiomas(
    estudios: EstudioFormulario[], idiomas: IdiomaFormulario[], c: CatalogosRegistro,
): Pick<RegistroCandidatoPayload, 'estudios' | 'idiomas'> {
    return {
        estudios: estudios.map(e => mapearEstudio(e, c)),
        idiomas: idiomas.map(i => mapearIdioma(i, c)),
    };
}

/** Paso 2 — Experiencia ("Busco mi primer empleo" = no tiene experiencia) */
export function payloadExperiencia(
    tieneExperiencia: boolean | null, experiencias: ExperienciaFormulario[], c: CatalogosRegistro,
): Pick<RegistroCandidatoPayload, 'busca_primer_empleo' | 'experiencias'> {
    const buscaPrimerEmpleo = tieneExperiencia === false;
    return {
        busca_primer_empleo: buscaPrimerEmpleo,
        ...(buscaPrimerEmpleo ? {} : { experiencias: experiencias.map(e => mapearExperiencia(e, c)) }),
    };
}

/** Paso 3 — Habilidades (técnicas + blandas, por nombre → IDs) */
export function payloadHabilidades(nombres: string[], c: CatalogosRegistro): Pick<RegistroCandidatoPayload, 'habilidades'> {
    return {
        habilidades: nombres
            .map(nombre => aId(c.habilidades, nombre))
            .filter((id): id is number => id !== null),
    };
}

/** Paso 4 — Registro completo */
export function payloadCompleto(
    datos: DatosPersonalesFormulario, estudios: EstudioFormulario[], idiomas: IdiomaFormulario[],
    tieneExperiencia: boolean | null, experiencias: ExperienciaFormulario[],
    habilidades: string[], c: CatalogosRegistro,
): RegistroCandidatoPayload {
    return {
        ...payloadDatosPersonales(datos),
        ...payloadEstudiosIdiomas(estudios, idiomas, c),
        ...payloadExperiencia(tieneExperiencia, experiencias, c),
        ...payloadHabilidades(habilidades, c),
    } as RegistroCandidatoPayload;
}


// Conversión de cada elemento de las listas

function mapearEstudio(e: EstudioFormulario, c: CatalogosRegistro): EstudioPayload {
    const tipo = c.tiposEstudio.find(t => normalizar(t.nombre) === normalizar(e.tipoEstudio));
    const llevaCarrera = tipo?.requiere_carrera ?? false;
    const estado = ESTADOS[e.estado];

    return {
        tipo_estudio_id: tipo?.id as number,
        area_estudio_id: aId(c.areasEstudio, e.areaEstudio) as number,
        pais_id: aId(c.paises, e.pais) as number,
        // Secundario y Terciario no llevan institución ni carrera
        institucion_id: llevaCarrera ? (e.institucionId ?? null) : null,
        carrera_id: llevaCarrera ? (e.carreraId ?? null) : null,
        estado,
        ciclo_actual: null,                  // el formulario no pide ciclo
        fecha_inicio: fechaMesAnio(e.fechaInicioMes, e.fechaInicioAno) as string,
        fecha_fin: e.alPresente || estado === 'en_curso' ? null : fechaMesAnio(e.fechaFinMes, e.fechaFinAno),
    };
}

function mapearIdioma(i: IdiomaFormulario, c: CatalogosRegistro): IdiomaPayload {
    return {
        idioma_id: aId(c.idiomas, i.idioma) as number,
        nivel_escrito: NIVELES_IDIOMA[i.nivelEscrito],
        nivel_oral: NIVELES_IDIOMA[i.nivelOral],
    };
}

function mapearExperiencia(e: ExperienciaFormulario, c: CatalogosRegistro): ExperienciaPayload {
    const puestoId = e.puestoId ?? aId(c.puestos, e.puesto);

    return {
        // Del catálogo → id. Escrito a mano → nombre (el backend lo crea como propuesta pendiente)
        ...(puestoId ? { puesto_id: puestoId } : { puesto_nombre: e.puesto.trim() }),
        ...(e.organizacionId ? { organizacion_id: e.organizacionId } : { organizacion_nombre: e.empresa.trim() }),
        pais_id: aId(c.paises, e.pais) as number,
        nivel: NIVELES_EXPERIENCIA[e.nivel],
        fecha_inicio: fechaMesAnio(e.fechaInicioMes, e.fechaInicioAno) as string,
        fecha_fin: e.alPresente ? null : fechaMesAnio(e.fechaFinMes, e.fechaFinAno),
        descripcion: e.descripcion?.trim() || null,
    };
}
