// Campos de "Precognition-Validate-Only" por paso del formulario de registro.
// El * abarca cada elemento de la lista (estudios.0.carrera_id, estudios.1.pais_id, ...).
export const CAMPOS_PASO: Record<0 | 1 | 2 | 3, string[]> = {
    0: ['nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'genero', 'celular', 'correo', 'password'],
    1: ['estudios', 'estudios.*.*', 'idiomas', 'idiomas.*.*'],
    2: ['busca_primer_empleo', 'experiencias', 'experiencias.*.*'],
    3: ['habilidades', 'habilidades.*'],
};
