export interface SkillSection {
    label: string;
    skills: string[];
}

// ─── Catálogo completo de habilidades (usado en el buscador del skill-picker) ──
export const CREO_SKILLS: string[] = [
    // Tecnología
    "JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "React", "Angular",
    "Vue.js", "Node.js", "Next.js", "Express.js", "GraphQL", "REST APIs", "SQL",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "Git", "Linux", "Scrum", "Agile", "CI/CD", "Terraform", "Django", "Laravel",
    "Spring Boot", ".NET", "TensorFlow", "PyTorch", "Pandas", "Scikit-learn", "R", "MATLAB",
    // Ingeniería
    "AutoCAD", "SolidWorks", "Instrumentación biomédica", "Gestión de proyectos",
    "Control de calidad", "Normas ISO", "Mantenimiento de equipos médicos",
    "Simulación de procesos", "Diseño CAD/CAM", "Gestión de la cadena de suministro",
    "Six Sigma", "Lectura de planos", "Automatización industrial", "Ingeniería de materiales",
    "Electrónica de potencia", "Circuitos eléctricos", "Programación de PLC", "Robótica",
    // Ciencias de la Salud
    "Atención al paciente", "Laboratorio clínico", "Primeros auxilios", "Epidemiología",
    "Nutrición clínica", "Farmacología", "Bioquímica", "Anatomía", "Fisiología",
    "Terapia física", "Cuidado intensivo", "Farmacovigilancia", "Salud pública",
    "Vacunación", "Historia clínica electrónica", "Bioseguridad",
    // Investigación y Datos
    "Investigación científica", "Estadística", "SPSS", "Análisis de datos",
    "Redacción académica", "Revisión sistemática", "Bioestadística", "Power BI",
    "Excel avanzado", "Machine Learning", "Visualización de datos", "Minería de datos",
    "Métodos cuantitativos", "Métodos cualitativos", "Muestreo estadístico",
    // Negocios y Administración
    "Contabilidad financiera", "Finanzas", "Marketing digital", "Administración",
    "Ventas", "Atención al cliente", "Negociación", "Planeamiento estratégico",
    "Recursos humanos", "Comercio exterior", "Costos y presupuestos", "SAP",
    "Google Analytics", "Community management", "Logística",
    // Diseño y Comunicación
    "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere", "After Effects",
    "UX Research", "Prototipado", "Diseño de interacción", "Branding", "Copywriting",
    "Fotografía", "Edición de video", "Diseño editorial", "Ilustración digital",
    "Diseño UI", "Wireframing", "Diseño gráfico", "UI/UX",
    // Ciencias Sociales y Educación
    "Diseño curricular", "Psicología clínica", "Psicología organizacional",
    "Investigación cualitativa", "Mediación de conflictos", "Derecho civil",
    "Derecho laboral", "Oratoria", "Redacción legal", "Docencia", "Evaluación educativa",
    "Terapia cognitivo-conductual", "Trabajo social", "Análisis normativo",
    "Ética profesional", "Gestión de conflictos", "Tutoría académica"
];

export const SOFT_SKILLS: string[] = [
    "Liderazgo", "Comunicación efectiva", "Trabajo en equipo", "Resolución de problemas",
    "Pensamiento crítico", "Gestión del tiempo", "Adaptabilidad", "Creatividad",
    "Empatía", "Toma de decisiones", "Proactividad", "Resiliencia", "Inteligencia emocional"
];

//  Categorias : Carreras
export const CAREER_TAXONOMY: Record<string, string[]> = {
    "Tecnología": ["Ingeniería de Software", "Ciencias de la Computación", "Ingeniería de Sistemas", "Ingeniería en Telecomunicaciones", "Ciberseguridad"],
    "Ingeniería": ["Ingeniería Biomédica", "Ingeniería Industrial", "Ingeniería Civil", "Ingeniería Electrónica", "Ingeniería Mecánica", "Ingeniería Química", "Ingeniería Ambiental"],
    "Ciencias de la Salud": ["Medicina Humana", "Enfermería", "Nutrición", "Tecnología Médica", "Odontología", "Farmacia y Bioquímica"],
    "Investigación y Datos": ["Estadística", "Bioestadística", "Ciencia de Datos", "Matemática Aplicada"],
    "Negocios y Administración": ["Administración", "Marketing", "Contabilidad", "Economía", "Negocios Internacionales", "Recursos Humanos"],
    "Diseño y Comunicación": ["Diseño Gráfico", "Diseño de Producto / UX-UI", "Comunicación Audiovisual", "Publicidad y Marketing"],
    "Ciencias Sociales y Educación": ["Psicología", "Educación", "Derecho", "Sociología"],
};

// Habilidades Tecnicas/blandas : Categoria
export const CATEGORY_MAP: Record<string, string> = {
    "Atención al paciente": "Ciencias de la Salud",
    "Laboratorio clínico": "Ciencias de la Salud",
    "Primeros auxilios": "Ciencias de la Salud",
    "Epidemiología": "Ciencias de la Salud",
    "Nutrición clínica": "Ciencias de la Salud",
    "Farmacología": "Ciencias de la Salud",
    "Bioquímica": "Ciencias de la Salud",
    "Investigación científica": "Investigación",
    "Estadística": "Investigación",
    "SPSS": "Investigación",
    "Análisis de datos": "Investigación",
    "Redacción académica": "Investigación",
    "Revisión sistemática": "Investigación",
    "Bioestadística": "Investigación",
    "Python": "Tecnología",
    "R": "Tecnología",
    "Excel avanzado": "Tecnología",
    "SQL": "Tecnología",
    "Power BI": "Tecnología",
    "MATLAB": "Tecnología",
    "Contabilidad": "Negocios",
    "Finanzas": "Negocios",
    "Marketing": "Negocios",
    "Administración": "Negocios",
    "Ventas": "Negocios",
    "Logística": "Negocios",
    "Gestión de proyectos": "Negocios",
    "Diseño gráfico": "Comunicación y Diseño",
    "Edición de video": "Comunicación y Diseño",
    "Fotografía": "Comunicación y Diseño",
    "Community management": "Comunicación y Diseño",
    "Redacción periodística": "Comunicación y Diseño",
    "Inglés (B2+)": "Idiomas",
    "Portugués": "Idiomas",
    "Francés": "Idiomas",
    "Alemán": "Idiomas",
    "Docencia": "Educación",
    "Tutoría académica": "Educación",
    "Liderazgo": "Transversales",
    "Trabajo en equipo": "Transversales",
    "Comunicación efectiva": "Transversales",
    "Resolución de problemas": "Transversales",
    "Pensamiento crítico": "Transversales",
};

// Habilidades sugeridas por Categorias
export const AREA_SKILLS: Record<string, string[]> = {
    "Tecnología": ["JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "React", "Angular", "Vue.js", "Node.js", "Next.js", "Express.js", "GraphQL", "REST APIs", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "Linux", "Scrum", "Agile"],
    "Ingeniería": ["MATLAB", "AutoCAD", "SolidWorks", "Instrumentación biomédica", "Gestión de proyectos", "Control de calidad", "Normas ISO", "Mantenimiento de equipos médicos", "Simulación de procesos", "Diseño CAD/CAM", "Gestión de la cadena de suministro", "Six Sigma", "Lectura de planos", "Automatización industrial", "Ingeniería de materiales", "Electrónica de potencia", "Circuitos eléctricos", "Programación de PLC", "Robótica"],
    "Ciencias de la Salud": ["Atención al paciente", "Laboratorio clínico", "Primeros auxilios", "Epidemiología", "Nutrición clínica", "Farmacología", "Bioquímica", "Anatomía", "Fisiología", "Terapia física", "Cuidado intensivo", "Farmacovigilancia", "Salud pública", "Vacunación", "Historia clínica electrónica", "Bioseguridad"],
    "Investigación y Datos": ["Investigación científica", "Estadística", "SPSS", "Análisis de datos", "Redacción académica", "Revisión sistemática", "Bioestadística", "R", "Power BI", "Excel avanzado", "Machine Learning", "Visualización de datos", "Minería de datos", "Métodos cuantitativos", "Métodos cualitativos", "Muestreo estadístico"],
    "Negocios y Administración": ["Excel avanzado", "Power BI", "Marketing digital", "Contabilidad financiera", "Negociación", "Gestión de proyectos", "Planeamiento estratégico", "Recursos humanos", "Ventas", "Atención al cliente", "Comercio exterior", "Costos y presupuestos", "SAP", "Google Analytics", "Community management"],
    "Diseño y Comunicación": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere", "After Effects", "UX Research", "Prototipado", "Diseño de interacción", "Branding", "Copywriting", "Fotografía", "Edición de video", "Diseño editorial", "Ilustración digital", "Diseño UI", "Wireframing"],
    "Ciencias Sociales y Educación": ["Diseño curricular", "Psicología clínica", "Psicología organizacional", "Investigación cualitativa", "Mediación de conflictos", "Derecho civil", "Derecho laboral", "Oratoria", "Redacción legal", "Docencia", "Evaluación educativa", "Terapia cognitivo-conductual", "Trabajo social", "Análisis normativo", "Ética profesional", "Gestión de conflictos"]
};

// Mapeo entre "Área de estudio" (formulario de Educación) y las categorías
export const AREA_ESTUDIO_TO_CATEGORIA: Record<string, string> = {
    "Ingeniería": "Ingeniería",
    "Administración": "Negocios y Administración",
    "Diseño": "Diseño y Comunicación",
    "Salud": "Ciencias de la Salud",
    "Educación": "Ciencias Sociales y Educación",
    "Tecnología": "Tecnología",
};

export const CREO_SECTORS: string[] = [
    "Salud y Medicina",
    "Ciencias e Investigación",
    "Tecnología e Informática",
    "Educación",
    "Administración y Negocios",
    "Comunicación y Marketing",
    "Diseño y Artes",
    "Derecho",
    "Ingeniería",
];
