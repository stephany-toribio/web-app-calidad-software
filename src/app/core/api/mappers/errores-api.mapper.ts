import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-response.model';

/** Claves de error que muestra el formulario de registro (creo-register-candidate.component.html) */
export type ErroresFormulario = Record<string, string>;

// Mensajes de unicidad del backend (RegistrarCandidatoRequest::messages).
const CORREO_DUPLICADO = 'Este correo ya pertenece a una cuenta registrada.';
const DNI_DUPLICADO = 'El DNI ya existe en la base de datos.';
const CONFIRMACION_NO_COINCIDE = 'La confirmación de la contraseña no coincide.';


// Campo del backend → clave del formulario (campos simples)
const CAMPOS: Record<string, string> = {
    nombre: 'firstName',
    apellidos: 'lastName',
    fecha_nacimiento: 'birthdate',
    dni: 'dni',
    correo: 'email',
    celular: 'phone',
    password: 'password',
};

// Prefijo de campos de lista → clave de la sección del formulario
const SECCIONES: Record<string, { clave: string; etiqueta: string }> = {
    estudios: { clave: 'carreras', etiqueta: 'Estudio' },
    idiomas: { clave: 'idiomas', etiqueta: 'Idioma' },
    experiencias: { clave: 'experiencia', etiqueta: 'Experiencia' },
    busca_primer_empleo: { clave: 'experiencia', etiqueta: '' },
    habilidades: { clave: 'skills', etiqueta: 'Habilidad' },
};

/**
 * Convierte un error de la API en errores del formulario.
 * - 422: un mensaje por campo/sección (el primero de cada uno).
 * - 400 MAX_HABILIDADES_EXCEDIDO: error en habilidades.
 * - Sin conexión u otro error: clave 'api' con un mensaje general.
 */
export function erroresDesdeApi(respuesta: HttpErrorResponse): ErroresFormulario {
    const cuerpo = respuesta.error as ApiError | null;

    if (respuesta.status === 0) {
        return { api: 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.' };
    }

    if (respuesta.status === 400 && cuerpo?.error_code === 'MAX_HABILIDADES_EXCEDIDO') {
        return { skills: cuerpo.message };
    }

    if (respuesta.status === 422 && cuerpo?.errors) {
        return traducirValidacion(cuerpo.errors);
    }

    return { api: cuerpo?.message ?? 'Ocurrió un error inesperado. Inténtalo más tarde.' };
}

function traducirValidacion(errores: Record<string, string[]>): ErroresFormulario {
    const resultado: ErroresFormulario = {};

    for (const [campo, mensajes] of Object.entries(errores)) {
        const mensaje = mensajes[0];


        if (campo === 'correo' && mensaje === CORREO_DUPLICADO) { resultado['emailTaken'] = 'duplicate'; continue; }
        if (campo === 'dni' && mensaje === DNI_DUPLICADO) { resultado['dniTaken'] = 'duplicate'; continue; }
        if (campo === 'password' && mensaje === CONFIRMACION_NO_COINCIDE) { resultado['passwordConfirm'] = mensaje; continue; }


        if (CAMPOS[campo]) { resultado[CAMPOS[campo]] ??= mensaje; continue; }


        const [raiz, indice] = campo.split('.');
        const seccion = SECCIONES[raiz];
        if (seccion) {
            const prefijo = seccion.etiqueta && indice !== undefined ? `${seccion.etiqueta} ${+indice + 1}: ` : '';
            resultado[seccion.clave] ??= prefijo + mensaje;
            continue;
        }


        resultado['api'] ??= mensaje;
    }

    return resultado;
}
