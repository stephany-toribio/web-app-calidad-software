export const CREO_SKILLS: string[] = [
    "Atención al paciente", "Laboratorio clínico", "Primeros auxilios",
    "Epidemiología", "Nutrición clínica", "Farmacología", "Bioquímica",
    "Investigación científica", "Estadística", "SPSS", "Análisis de datos",
    "Redacción académica", "Revisión sistemática", "Bioestadística",
    "Python", "R", "Excel avanzado", "SQL", "Power BI", "MATLAB",
    "React", "TypeScript", "JavaScript", "Node.js", "Next.js", "Vue.js",
    "GraphQL", "REST APIs", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Git", "CI/CD", "Terraform",
    "Django", "Laravel", "PHP", "Java", "Spring Boot", "C#", ".NET",
    "TensorFlow", "PyTorch", "Pandas", "Scikit-learn",
    "Contabilidad", "Finanzas", "Marketing", "Administración", "Ventas",
    "Logística", "Gestión de proyectos",
    "Diseño gráfico", "Edición de video", "Fotografía",
    "Community management", "Redacción periodística", "Figma", "UI/UX",
    "Inglés (B2+)", "Portugués", "Francés", "Alemán",
    "Docencia", "Tutoría académica",
    "Liderazgo", "Trabajo en equipo", "Comunicación efectiva",
    "Resolución de problemas", "Pensamiento crítico",
];

export interface SkillSection {
    label: string;
    skills: string[];
}

export const CAREER_TAXONOMY: Record<string, string[]> = {
    "Tecnología": ["Ingeniería de Software", "Ciencias de la Computación", "Ingeniería de Sistemas"],
    "Ingeniería": ["Ingeniería Biomédica", "Ingeniería Industrial", "Ingeniería Civil", "Ingeniería Electrónica"],
    "Ciencias de la Salud": ["Medicina Humana", "Enfermería", "Nutrición", "Tecnología Médica"],
    "Investigación y Datos": ["Estadística", "Bioestadística", "Ciencia de Datos"],
    "Negocios y Administración": ["Administración", "Marketing", "Contabilidad", "Economía"],
};

export const AREA_SKILLS: Record<string, string[]> = {
    "Tecnología": ["JavaScript", "TypeScript", "Python", "React", "Angular", "Vue.js", "Node.js", "Next.js", "GraphQL", "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git", "Scrum"],
    "Ingeniería": ["MATLAB", "AutoCAD", "Instrumentación biomédica", "Gestión de proyectos", "Control de calidad"],
    "Ciencias de la Salud": ["Atención al paciente", "Laboratorio clínico", "Primeros auxilios", "Epidemiología", "Nutrición clínica", "Farmacología", "Bioquímica"],
    "Investigación y Datos": ["Investigación científica", "Estadística", "SPSS", "Análisis de datos", "Redacción académica", "Revisión sistemática", "Bioestadística", "R", "Power BI"],
    "Negocios y Administración": ["Excel avanzado", "Power BI", "Marketing digital", "Contabilidad financiera", "Negociación"],
};

export const CREO_SECTORS: string[] = [
    "Salud y Medicina", "Ciencias e Investigación", "Tecnología e Informática",
    "Educación", "Administración y Negocios", "Comunicación y Marketing",
    "Diseño y Artes", "Derecho", "Ingeniería", "Otro",
];