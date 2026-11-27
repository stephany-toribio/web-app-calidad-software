export type ExperienceLevel = string;
export type KanbanColumn = "received" | "review" | "interview" | "hired" | "rejected";
export type SkillWeight = "required" | "preferred" | "bonus";

export const DEFAULT_ADMIN_LEVELS: string[] = [
  'Practicante preprofesional',
  'Practicante profesional',
  'Trainee',
  'Junior',
  'Semi Senior',
  'Senior',
  'Jefe / Supervisor',
  'Gerente / Director'
];

export interface SkillTag {
  skill: string;
  weight: SkillWeight;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  tags: string[];
  postedAgo: string;
  featured?: boolean;
  remote: boolean;
  match: number;
  experience: ExperienceLevel;
  area?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  companyDescription: string;
  applicants: number;
  /** Texto aproximado que envía la API (postulantes_aprox); tiene prioridad sobre applicants */
  postulantesAprox?: string;
  skillTags?: SkillTag[];
}

export interface Application {
  id: string;
  /** Vacante a la que pertenece: enlaza la postulación con su tarjeta del Kanban */
  jobId?: string;
  jobTitle: string;
  company: string;
  status: KanbanColumn;
  appliedDate: string;
  location: string;
}

export type JobStatus =
  | "active"
  | "paused"
  | "closed"
  | "inactive"
  | "pending_review"
  | "approved_pending_payment"
  | "rejected_by_moderation";
export type ManagedJobStatus = JobStatus;

export const STATUS_CONFIG: Record<KanbanColumn, { label: string; bg: string; text: string; dot: string }> = {
  received:  { label: "Recibido",    bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  review:    { label: "En Revisión", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  interview: { label: "Entrevista",  bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  hired:     { label: "Contratado",  bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  rejected:  { label: "Rechazado",   bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
};

export interface CompanyJob {
  id: string;
  title: string;
  location: string;
  applicants: number;
  status: "active" | "paused";
  daysLeft: number;
  remote: boolean;
}

export interface ManagedJob {
  id: string;
  title: string;
  status: JobStatus;
  applicants: number;
  publishedDate: string;
  closeDate: string;
  daysLeft: number;
  hireLimit?: number;
  moderationReason?: string;
  description?: string;
  level?: string;
  requirements?: string[];
  benefits?: string[];
  location?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  skillTags?: SkillTag[];
  remote?: boolean;
  /** Datos que el formulario necesita para reabrir la vacante tal como se creó */
  area?: string;
  modality?: string;
  closeDateISO?: string;
}

export function matchStyle(pct: number): { bg: string; text: string } {
  if (pct >= 80) return { bg: "#DCFCE7", text: "#15803D" };
  if (pct >= 50) return { bg: "#FEF9C3", text: "#A16207" };
  return { bg: "#FEE2E2", text: "#DC2626" };
}

export function companyInitial(name: string): string {
  return (name || "C").trim()[0].toUpperCase();
}

const AVATAR_COLORS = ["#F2B705", "#FDE68A", "#A7F3D0", "#BFDBFE", "#DDD6FE", "#FBCFE8"];
/**
 * Escala para mostrar las postulaciones de una vacante sin revelar el número exacto.
 * El orden es de mayor a menor: se toma el primer rango que la cantidad alcanza.
 */
const RANGOS_POSTULACIONES: { desde: number; etiqueta: string }[] = [
  { desde: 501, etiqueta: 'Más de 500 postulaciones' },
  { desde: 301, etiqueta: 'Más de 300 postulaciones' },
  { desde: 201, etiqueta: 'Más de 200 postulaciones' },
  { desde: 151, etiqueta: 'Más de 150 postulaciones' },
  { desde: 101, etiqueta: 'Más de 100 postulaciones' },
  { desde: 51, etiqueta: 'Más de 50 postulaciones' },
  { desde: 21, etiqueta: 'Más de 20 postulaciones' },
  { desde: 1, etiqueta: '1 - 20 postulaciones' },
];

/**
 * Convierte la cantidad real de postulaciones en una expresión aproximada.
 * Nunca inventa cantidades: el rango sale siempre del número real recibido.
 */
export function rangoPostulaciones(cantidad?: number | null): string {
  const n = Math.max(0, Math.floor(cantidad ?? 0));
  if (n === 0) return 'Sin postulaciones';
  return RANGOS_POSTULACIONES.find(r => n >= r.desde)!.etiqueta;
}

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export const JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior React Developer",
    company: "TechCorp SA",
    location: "Lima, Perú",
    salary: "S/ 8,000 – 12,000",
    salaryMin: 8000,
    salaryMax: 12000,
    tags: ["React", "TypeScript", "Next.js", "GraphQL", "AWS"],
    postedAgo: "Hace 1 día",
    featured: true,
    remote: true,
    match: 92,
    experience: "Senior",
    area: "Tecnología e Informática",
    description:
      "Buscamos un Senior React Developer para liderar el desarrollo frontend de nuestras plataformas SaaS de alto tráfico. Trabajarás con un equipo ágil de 8 ingenieros, implementando nuevas funcionalidades y mejorando la arquitectura existente con plena autonomía técnica.",
    requirements: [
      "5+ años de experiencia con React y ecosistema moderno",
      "TypeScript avanzado (tipos genéricos, utility types, strict mode)",
      "Experiencia con Next.js, App Router y Server Components",
      "Conocimiento de GraphQL y Apollo Client",
      "Manejo de servicios AWS (S3, Lambda, RDS, CloudFront)",
      "Metodologías ágiles: Scrum o Kanban",
    ],
    benefits: [
      "Trabajo 100% remoto desde cualquier lugar de Latinoamérica",
      "Seguro médico privado para el colaborador y cónyuge",
      "Bono de equipamiento hasta S/ 3,000 al ingreso",
      "Presupuesto anual de capacitación de S/ 2,500",
      "Horario flexible con core hours de 10am–4pm",
    ],
    companyDescription:
      "TechCorp SA es una fintech B2B líder en Latinoamérica con más de 500 empleados en 8 países. Procesamos más de $2B en transacciones anuales para 12,000 empresas cliente.",
    applicants: 47,
    skillTags: [
      { skill: "React", weight: "required" },
      { skill: "TypeScript", weight: "required" },
      { skill: "Next.js", weight: "preferred" },
      { skill: "GraphQL", weight: "preferred" },
      { skill: "AWS", weight: "bonus" },
    ],
  },
  {
    id: "j5",
    title: "Python Developer ML",
    company: "AI Ventures PE",
    location: "Remoto",
    salary: "S/ 7,500 – 11,000",
    salaryMin: 7500,
    salaryMax: 11000,
    tags: ["Python", "Django", "TensorFlow", "PostgreSQL", "Docker"],
    postedAgo: "Hace 3 días",
    remote: true,
    match: 88,
    experience: "Senior",
    area: "Tecnología e Informática",
    description:
      "Construye sistemas de IA para el sector salud. Tus modelos de machine learning ayudarán a diagnosticar enfermedades en etapas tempranas, generando impacto real en millones de personas en Latinoamérica.",
    requirements: [
      "4+ años con Python en producción",
      "Django y Django REST Framework para APIs robustas",
      "Conocimientos sólidos en ML: TensorFlow o PyTorch",
      "PostgreSQL avanzado para gestión de datos médicos",
      "Docker, CI/CD y despliegues en AWS o GCP",
    ],
    benefits: [
      "Trabajo 100% remoto desde Latinoamérica",
      "Misión de impacto en salud pública",
      "Equity en etapa temprana",
      "Acceso a GPUs en la nube para experimentación",
    ],
    companyDescription:
      "AI Ventures PE aplica inteligencia artificial para transformar el diagnóstico médico en Latinoamérica.",
    applicants: 18,
    skillTags: [
      { skill: "Python", weight: "required" },
      { skill: "Django", weight: "required" },
      { skill: "TensorFlow", weight: "preferred" },
      { skill: "PostgreSQL", weight: "bonus" },
    ],
  },
  {
    id: "j4",
    title: "Backend Developer Node.js",
    company: "Fintech Innova",
    location: "San Isidro, Lima",
    salary: "S/ 6,000 – 8,500",
    salaryMin: 6000,
    salaryMax: 8500,
    tags: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Docker"],
    postedAgo: "Hace 1 semana",
    remote: false,
    match: 84,
    experience: "Semi Senior",
    area: "Tecnología e Informática",
    description:
      "Desarrolla la API que mueve millones de soles diariamente. Somos una fintech en crecimiento acelerado (Series A) buscando un backend sólido para escalar nuestros microservicios a 10× su capacidad actual.",
    requirements: [
      "4+ años con Node.js en entornos de producción de alta concurrencia",
      "TypeScript proficiente, código tipado end-to-end",
      "Diseño de APIs RESTful y arquitectura de microservicios",
      "PostgreSQL avanzado: índices, particionamiento, query planning",
      "Docker y comprensión básica de Kubernetes",
    ],
    benefits: [
      "Modalidad híbrida (3 días presencial en San Isidro)",
      "Stock options del equipo fundador",
      "Seguro médico premium con cobertura ampliada",
      "Viajes anuales de equipo",
    ],
    companyDescription:
      "Fintech Innova democratiza el acceso a crédito para PYMEs peruanas usando tecnología e inteligencia artificial.",
    applicants: 24,
    skillTags: [
      { skill: "Node.js", weight: "required" },
      { skill: "TypeScript", weight: "required" },
      { skill: "PostgreSQL", weight: "preferred" },
      { skill: "REST APIs", weight: "bonus" },
    ],
  },
  {
    id: "j2",
    title: "Data Scientist Jr.",
    company: "DataLab Perú",
    location: "Miraflores, Lima",
    salary: "S/ 4,500 – 6,000",
    salaryMin: 4500,
    salaryMax: 6000,
    tags: ["Python", "SQL", "Pandas", "TensorFlow", "Scikit-learn"],
    postedAgo: "Hace 3 días",
    remote: false,
    match: 78,
    experience: "Junior",
    area: "Tecnología e Informática",
    description:
      "Únete al equipo de ciencia de datos de DataLab Perú para construir modelos predictivos que impactan decisiones de negocio de las empresas más grandes del país. Aprenderás de un equipo senior con experiencia en Silicon Valley.",
    requirements: [
      "1-2 años de experiencia en ciencia de datos o roles relacionados",
      "Python sólido: Pandas, NumPy, Scikit-learn",
      "SQL intermedio a avanzado (JOINs complejos, funciones de ventana)",
      "Experiencia con modelos de ML supervisados (regresión, clasificación)",
      "Manejo básico de TensorFlow o PyTorch",
    ],
    benefits: [
      "Oficinas premium en Miraflores con vista al mar",
      "Seguro médico y ticket de alimentación",
      "Acceso a Coursera y O'Reilly Learning",
      "Mentoría mensual con senior scientists",
    ],
    companyDescription:
      "DataLab Perú es la consultora de datos más reconocida del país, con clientes en banca, retail y telecomunicaciones.",
    applicants: 12,
    skillTags: [
      { skill: "Python", weight: "required" },
      { skill: "SQL", weight: "required" },
      { skill: "Pandas", weight: "preferred" },
      { skill: "TensorFlow", weight: "bonus" },
    ],
  },
  {
    id: "j3",
    title: "DevOps Engineer",
    company: "CloudSystems PE",
    location: "Remoto",
    salary: "S/ 7,000 – 9,500",
    salaryMin: 7000,
    salaryMax: 9500,
    tags: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
    postedAgo: "Hace 5 días",
    remote: true,
    match: 65,
    experience: "Semi Senior",
    area: "Tecnología e Informática",
    description:
      "Buscamos un DevOps Engineer para diseñar y mantener nuestra infraestructura cloud-native. Serás responsable de automatizar pipelines, gestionar clusters Kubernetes y garantizar la seguridad de la plataforma.",
    requirements: [
      "3+ años en roles DevOps o SRE",
      "Experiencia avanzada en Docker y Kubernetes (EKS o GKE)",
      "AWS Associate o Professional (certificación requerida o en proceso)",
      "Terraform y gestión de infraestructura como código",
      "Pipelines CI/CD con GitHub Actions o ArgoCD",
    ],
    benefits: [
      "Trabajo 100% remoto con equipo distribuido",
      "Certificaciones AWS pagadas por la empresa",
      "Bono de desempeño semestral hasta 20% del salario",
      "Días libres adicionales por certificaciones obtenidas",
    ],
    companyDescription:
      "CloudSystems PE ofrece soluciones de infraestructura cloud para medianas y grandes empresas en Perú, Chile y Colombia.",
    applicants: 31,
    skillTags: [
      { skill: "Docker", weight: "required" },
      { skill: "Kubernetes", weight: "required" },
      { skill: "AWS", weight: "preferred" },
      { skill: "Terraform", weight: "bonus" },
    ],
  },
  {
    id: "j6",
    title: "Full Stack PHP Developer",
    company: "eCommerce LATAM",
    location: "Lima, Perú",
    salary: "S/ 5,000 – 7,000",
    salaryMin: 5000,
    salaryMax: 7000,
    tags: ["PHP", "Laravel", "Vue.js", "MySQL", "Git"],
    postedAgo: "Hace 2 semanas",
    remote: false,
    match: 45,
    experience: "Semi Senior",
    area: "Tecnología e Informática",
    description:
      "Desarrolla y mantiene las plataformas de ecommerce para nuestros 200+ clientes retail. Trabajarás con Laravel en el backend y Vue.js en el frontend, integrando pasarelas de pago locales.",
    requirements: [
      "3+ años con PHP y Laravel en proyectos de ecommerce",
      "Vue.js o React para frontend dinámico",
      "MySQL optimizado para catálogos de gran volumen",
      "Integración con Culqi, PayU y otros payment gateways locales",
    ],
    benefits: [
      "Horario flexible (ingreso entre 8am y 10am)",
      "Seguro médico",
      "Bonos por hitos de proyectos",
    ],
    companyDescription:
      "eCommerce LATAM construye y gestiona tiendas online para más de 200 retailers en Perú y Colombia.",
    applicants: 8,
    skillTags: [
      { skill: "PHP", weight: "required" },
      { skill: "Laravel", weight: "required" },
      { skill: "Vue.js", weight: "preferred" },
      { skill: "MySQL", weight: "bonus" },
    ],
  },
  {
    id: "j7_ops",
    title: "Analista de Operaciones y Procesos",
    company: "Grupo Romero Retail",
    location: "Surco, Lima",
    salary: "S/ 4,200 – 5,800",
    salaryMin: 4200,
    salaryMax: 5800,
    tags: ["Excel avanzado", "SAP", "Gestión de proyectos", "Mejora continua", "KPIs y métricas"],
    postedAgo: "Hace 2 días",
    featured: true,
    remote: false,
    match: 89,
    experience: "Junior",
    area: "Administración y Negocios",
    description:
      "Buscamos un Analista de Operaciones para optimizar los flujos logísticos y administrativos en nuestros centros de distribución. Diseñarás tableros de control y liderarás iniciativas de mejora continua con impacto en la rentabilidad del negocio.",
    requirements: [
      "Bachiller en Administración de Empresas, Ingeniería Industrial o afines",
      "Manejo de Excel avanzado (tablas dinámicas complejas, macros, Power Query)",
      "Experiencia de al menos 1 año en gestión de operaciones o proyectos",
      "Conocimiento práctico de SAP o sistemas ERP similares",
      "Capacidad de análisis cuantitativo y elaboración de reportes ejecutivos"
    ],
    benefits: [
      "Planilla completa con todos los beneficios de ley",
      "Descuentos corporativos en empresas del grupo",
      "Seguro médico EPS cubierto al 80%",
      "Línea de carrera y capacitaciones constantes"
    ],
    companyDescription:
      "Grupo Romero Retail es uno de los conglomerados comerciales más sólidos de la región, con presencia nacional en múltiples sectores.",
    applicants: 29,
    skillTags: [
      { skill: "Excel avanzado", weight: "required" },
      { skill: "SAP", weight: "required" },
      { skill: "Gestión de proyectos", weight: "preferred" },
      { skill: "Mejora continua", weight: "bonus" }
    ]
  },
  {
    id: "j8_fin",
    title: "Jefe de Administración y Finanzas",
    company: "Inversiones del Pacífico",
    location: "San Isidro, Lima",
    salary: "S/ 9,000 – 13,500",
    salaryMin: 9000,
    salaryMax: 13500,
    tags: ["Planeamiento estratégico", "Costos y presupuestos", "SAP", "Flujo de caja", "Liderazgo"],
    postedAgo: "Hace 4 días",
    remote: false,
    match: 91,
    experience: "Jefe / Supervisor",
    area: "Administración y Negocios",
    description:
      "Lidera el área administrativa y financiera corporativa. Supervisarás tesorería, contabilidad, presupuestos y control interno, reportando directamente a la Gerencia General.",
    requirements: [
      "Titulado y colegiado en Administración, Economía o Contabilidad",
      "Mínimo 5 años de experiencia liderando equipos administrativos y financieros",
      "Experiencia sólida en formulación y control de presupuestos anuales",
      "Manejo avanzado de ERP (SAP S/4HANA o similar)",
      "Liderazgo de equipos multidisciplinarios y toma de decisiones estratégicas"
    ],
    benefits: [
      "Salario competitivo acorde al mercado",
      "Bono anual por cumplimiento de objetivos de gestión",
      "Seguro médico privado con cobertura familiar",
      "Estacionamiento asignado en San Isidro"
    ],
    companyDescription:
      "Inversiones del Pacífico es una firma de gestión patrimonial e inmobiliaria con más de 20 años en el mercado peruano.",
    applicants: 15,
    skillTags: [
      { skill: "Planeamiento estratégico", weight: "required" },
      { skill: "Costos y presupuestos", weight: "required" },
      { skill: "SAP", weight: "preferred" },
      { skill: "Liderazgo", weight: "bonus" }
    ]
  },
  {
    id: "j9_mkt",
    title: "Especialista de Marketing Digital y Growth",
    company: "Agencia Creativa Zenith",
    location: "Remoto",
    salary: "S/ 5,500 – 8,000",
    salaryMin: 5500,
    salaryMax: 8000,
    tags: ["Marketing digital", "Google Ads", "Meta Ads", "Google Analytics", "SEO / SEM"],
    postedAgo: "Hace 1 día",
    remote: true,
    match: 86,
    experience: "Semi Senior",
    area: "Marketing y Publicidad",
    description:
      "Buscamos un Especialista en Growth y Marketing Digital para liderar campañas de adquisición y retención para cuentas internacionales. Gestionarás presupuestos publicitarios y optimización de embudos de conversión.",
    requirements: [
      "3+ años administrando campañas en Google Ads y Meta Ads Manager",
      "Dominio de Google Analytics 4 (GA4) y Google Tag Manager",
      "Conocimientos sólidos en estrategias de SEO on-page y off-page",
      "Capacidad analítica para interpretación de métricas CAC, ROAS y LTV",
      "Excelente redacción y habilidades de copywriting persuasivo"
    ],
    benefits: [
      "Trabajo 100% remoto con horario flexible",
      "Bono por cumplimiento de objetivos de adquisición",
      "Presupuesto anual para cursos y certificaciones oficiales",
      "Viernes de jornada reducida en verano"
    ],
    companyDescription:
      "Zenith es una agencia de growth marketing enfocada en potenciar marcas de comercio electrónico y SaaS en Perú y EE.UU.",
    applicants: 38,
    skillTags: [
      { skill: "Marketing digital", weight: "required" },
      { skill: "Google Ads", weight: "required" },
      { skill: "Meta Ads", weight: "preferred" },
      { skill: "Google Analytics", weight: "bonus" }
    ]
  },
  {
    id: "j10_com",
    title: "Practicante Profesional de Comunicación y Redes",
    company: "BrandWave Perú",
    location: "Miraflores, Lima",
    salary: "S/ 1,300 – 1,600",
    salaryMin: 1300,
    salaryMax: 1600,
    tags: ["Community Management", "Copywriting", "Edición de video", "Branding", "Redes sociales"],
    postedAgo: "Hace 3 días",
    remote: false,
    match: 82,
    experience: "Practicante profesional",
    area: "Marketing y Publicidad",
    description:
      "Oportunidad para egresados de Ciencias de la Comunicación, Publicidad o Marketing. Apoyarás en la creación de parrillas de contenido, redacción creativa y gestión de comunidades digitales.",
    requirements: [
      "Egresado universitario de Comunicación, Publicidad o Marketing",
      "Excelente ortografía, redacción y creatividad publicitaria",
      "Manejo de herramientas de edición de video (CapCut, Premiere)",
      "Interés en tendencias de TikTok, Instagram Reels y LinkedIn",
      "Proactividad, trabajo en equipo y entusiasmo por aprender"
    ],
    benefits: [
      "Convenio de prácticas profesionales de acuerdo a ley",
      "Seguro FOLA cubierto al 100%",
      "Mentoría directa con directores creativos",
      "Excelente clima laboral y posibilidad de pase a planilla"
    ],
    companyDescription:
      "BrandWave es una agencia boutique de branding y contenido digital para marcas de consumo masivo.",
    applicants: 42,
    skillTags: [
      { skill: "Community Management", weight: "required" },
      { skill: "Copywriting", weight: "required" },
      { skill: "Edición de video", weight: "preferred" }
    ]
  },
  {
    id: "j11_cont",
    title: "Contador General y Tributario",
    company: "Estudio Contable Alva & Asoc.",
    location: "San Borja, Lima",
    salary: "S/ 7,000 – 9,500",
    salaryMin: 7000,
    salaryMax: 9500,
    tags: ["Contabilidad general", "Tributación y SUNAT", "Estados financieros", "Concar", "Auditoría"],
    postedAgo: "Hace 2 días",
    remote: false,
    match: 90,
    experience: "Senior",
    area: "Contabilidad y Finanzas",
    description:
      "Buscamos un Contador Público Colegiado con sólida experiencia en tributación nacional y formulación de estados financieros para cartera de clientes corporativos.",
    requirements: [
      "Contador Público Colegiado con habilitación vigente",
      "5+ años de experiencia en puestos similares o firmas contables",
      "Conocimiento profundo de normatividad SUNAT, NIIF y fiscalizaciones",
      "Dominio del sistema contable Concar y hojas de cálculo avanzadas",
      "Capacidad de gestión de auditorías financieras y tributarias"
    ],
    benefits: [
      "Planilla completa con beneficios de ley al 100%",
      "Seguro médico EPS corporativo",
      "Bono anual por metas del estudio",
      "Capacitaciones tributarias especializadas continuas"
    ],
    companyDescription:
      "Estudio Contable Alva & Asoc. brinda asesoría contable, tributaria y laboral a medianas y grandes empresas peruanas.",
    applicants: 19,
    skillTags: [
      { skill: "Contabilidad general", weight: "required" },
      { skill: "Tributación y SUNAT", weight: "required" },
      { skill: "Estados financieros", weight: "preferred" },
      { skill: "Concar", weight: "bonus" }
    ]
  },
  {
    id: "j12_fin_pre",
    title: "Practicante Preprofesional de Finanzas",
    company: "Banco Capital Andino",
    location: "San Isidro, Lima",
    salary: "S/ 1,200 – 1,400",
    salaryMin: 1200,
    salaryMax: 1400,
    tags: ["Excel financiero", "Análisis de datos", "Flujo de caja", "Modelación financiera"],
    postedAgo: "Hace 5 días",
    remote: false,
    match: 85,
    experience: "Practicante preprofesional",
    area: "Contabilidad y Finanzas",
    description:
      "Programa de formación preprofesional en banca de inversión y tesorería. Apoyarás en el armado de flujos de caja, valorización de activos y preparación de informes financieros para comités de crédito.",
    requirements: [
      "Estudiante de los últimos ciclos (7mo a 9no) de Economía, Finanzas o Administración",
      "Dominio de Excel a nivel intermedio-avanzado (funciones financieras)",
      "Inglés intermedio a avanzado (lectura de reportes internacionales)",
      "Alto rigor analítico, minuciosidad y orientación numérica",
      "Disponibilidad de 30 horas semanales según convenio de ley"
    ],
    benefits: [
      "Convenio de prácticas preprofesionales con seguro médico FOLA",
      "Media subvención cada seis meses según ley",
      "Capacitación en Bloomberg Terminal y plataformas financieras",
      "Ruta clara de incorporación como Trainee al egresar"
    ],
    companyDescription:
      "Banco Capital Andino es una institución financiera líder en soluciones corporativas y mercado de capitales.",
    applicants: 54,
    skillTags: [
      { skill: "Excel financiero", weight: "required" },
      { skill: "Análisis de datos", weight: "required" },
      { skill: "Flujo de caja", weight: "preferred" }
    ]
  },
  {
    id: "j13_comercial",
    title: "Ejecutivo Comercial B2B",
    company: "Soluciones Industriales SAC",
    location: "Lima, Perú",
    salary: "S/ 4,000 – 7,500",
    salaryMin: 4000,
    salaryMax: 7500,
    tags: ["Ventas B2B", "Negociación comercial", "CRM (HubSpot / Salesforce)", "Prospección de clientes", "Cierre de ventas"],
    postedAgo: "Hace 6 días",
    remote: false,
    match: 87,
    experience: "Semi Senior",
    area: "Ventas y Comercial",
    description:
      "Responsable de la prospección, negociación y cierre de acuerdos comerciales corporativos en los sectores minería, construcción y manufactura. Base fija atractiva más comisiones sin tope.",
    requirements: [
      "2 a 4 años de experiencia en ventas corporativas B2B consultivas",
      "Manejo de herramientas CRM (Salesforce, HubSpot o Zoho)",
      "Capacidad comprobada de prospección en frío y negociación con gerencias",
      "Habilidades sólidas de oratoria, persuasión y cierre de negocios",
      "Disponibilidad para visitas comerciales a clientes corporativos"
    ],
    benefits: [
      "Sueldo fijo competitivo más comisiones mensuales no topadas",
      "Movilidad y viáticos cubiertos por la empresa",
      "Seguro médico EPS con cobertura familiar",
      "Premios por superación de metas trimestrales"
    ],
    companyDescription:
      "Soluciones Industriales SAC suministra maquinaria y componentes de alta ingeniería para grandes proyectos en el Perú.",
    applicants: 23,
    skillTags: [
      { skill: "Ventas B2B", weight: "required" },
      { skill: "Negociación comercial", weight: "required" },
      { skill: "CRM (HubSpot / Salesforce)", weight: "preferred" }
    ]
  },
  {
    id: "j14_rrhh",
    title: "Analista de Atracción del Talento y Selección",
    company: "Talento Global Consultores",
    location: "Miraflores, Lima",
    salary: "S/ 3,500 – 5,000",
    salaryMin: 3500,
    salaryMax: 5000,
    tags: ["Reclutamiento y selección", "Entrevistas por competencias", "Legislación laboral", "Clima y cultura organizacional"],
    postedAgo: "Hace 1 semana",
    remote: true,
    match: 80,
    experience: "Junior",
    area: "Recursos Humanos",
    description:
      "Gestionarás procesos de selección integrales para perfiles técnicos, comerciales y operativos. Diseñarás dinámicas de evaluación y mantendrás comunicación cercana con candidatos y líderes de área.",
    requirements: [
      "Licenciado o Bachiller en Psicología, Recursos Humanos o Administración",
      "Mínimo 1.5 años de experiencia en reclutamiento y selección",
      "Experiencia en entrevistas por competencias (STAR) y pruebas psicométricas",
      "Manejo de portales de empleo, LinkedIn Recruiter y base de candidatos",
      "Empatía, comunicación asertiva y alta organización"
    ],
    benefits: [
      "Modalidad de trabajo híbrida con 3 días remotos",
      "Planilla completa con todos los beneficios de ley",
      "Seguro médico EPS",
      "Día libre por onomástico y celebraciones"
    ],
    companyDescription:
      "Talento Global Consultores asesora a corporaciones regionales en adquisición de talento estratégico y gestión de personas.",
    applicants: 35,
    skillTags: [
      { skill: "Reclutamiento y selección", weight: "required" },
      { skill: "Entrevistas por competencias", weight: "required" },
      { skill: "Clima y cultura organizacional", weight: "preferred" }
    ]
  },
  {
    id: "j15_uiux",
    title: "Diseñador UI/UX & Producto Digital",
    company: "PixelCraft Studio",
    location: "Remoto",
    salary: "S/ 6,000 – 8,500",
    salaryMin: 6000,
    salaryMax: 8500,
    tags: ["Figma", "Diseño UI/UX", "Wireframing & Prototipado", "UX Research", "Design Systems"],
    postedAgo: "Hace 4 días",
    remote: true,
    match: 94,
    experience: "Semi Senior",
    area: "Diseño y Creatividad",
    description:
      "Crea experiencias digitales intuitivas y atractivas para aplicaciones web y móviles de escala masiva. Diseñarás flujos de usuario, wireframes, prototipos en Figma y alimentarás el Design System del producto.",
    requirements: [
      "3+ años de experiencia demostrable en diseño UI/UX (portafolio imprescindible)",
      "Dominio experto de Figma (variables, autolayout, component libraries)",
      "Metodologías de UX Research: pruebas de usabilidad, entrevistas, card sorting",
      "Comprensión de lineamientos Material Design y Human Interface Guidelines",
      "Capacidad de trabajo en sinergia con equipos de desarrollo frontend"
    ],
    benefits: [
      "Trabajo 100% remoto con equipamiento Mac proporcionado",
      "Presupuesto anual para compra de licencias y libros de diseño",
      "Seguro médico privado",
      "Ambiente colaborativo enfocado en calidad de producto"
    ],
    companyDescription:
      "PixelCraft Studio es una consultora boutique de diseño de producto digital que trabaja con startups de Fintech y Edtech en América Latina.",
    applicants: 41,
    skillTags: [
      { skill: "Figma", weight: "required" },
      { skill: "Diseño UI/UX", weight: "required" },
      { skill: "Wireframing & Prototipado", weight: "preferred" },
      { skill: "UX Research", weight: "bonus" }
    ]
  },
  {
    id: "j16_salud",
    title: "Enfermero(a) Ocupacional y Asistencial",
    company: "Clínica San Gabriel",
    location: "Los Olivos, Lima",
    salary: "S/ 3,800 – 5,200",
    salaryMin: 3800,
    salaryMax: 5200,
    tags: ["Atención al paciente", "Bioseguridad", "Primeros auxilios", "Salud ocupacional", "Historia clínica electrónica"],
    postedAgo: "Hace 5 días",
    remote: false,
    match: 83,
    experience: "Junior",
    area: "Salud y Medicina",
    description:
      "Atención directa de pacientes ambulatorios y ejecución del plan anual de vigilancia y salud en el trabajo para empresas aliadas. Manejo de registros clínicos y protocolos de bioseguridad.",
    requirements: [
      "Licenciatura en Enfermería con colegiatura y habilidad vigente",
      "Diplomado o capacitación en Salud Ocupacional (deseable)",
      "Experiencia mínima de 1 año en atención ambulatoria u ocupacional",
      "Conocimiento de protocolos de bioseguridad y triaje asistencial",
      "Vocación de servicio, calidez humana y trabajo bajo presión"
    ],
    benefits: [
      "Planilla completa con todos los beneficios de ley",
      "Seguro de accidentes personales y uniforme completo",
      "Alimentación cubierta durante el turno de trabajo",
      "Descuentos en atenciones médicas para familiares directos"
    ],
    companyDescription:
      "Clínica San Gabriel cuenta con más de 15 años de trayectoria brindando servicios médicos y de salud ocupacional de alta calidad.",
    applicants: 16,
    skillTags: [
      { skill: "Atención al paciente", weight: "required" },
      { skill: "Bioseguridad", weight: "required" },
      { skill: "Primeros auxilios", weight: "preferred" }
    ]
  },
];

export const APPLICATIONS: Application[] = [
  {
    id: "a1",
    jobTitle: "Senior React Developer",
    company: "TechCorp SA",
    status: "review",
    appliedDate: "21 ago 2025",
    location: "Lima, Perú · Remoto",
  },
  {
    id: "a2",
    jobTitle: "Python Developer ML",
    company: "AI Ventures PE",
    status: "interview",
    appliedDate: "18 ago 2025",
    location: "Remoto",
  },
  {
    id: "a3",
    jobTitle: "Backend Developer Node.js",
    company: "Fintech Innova",
    status: "received",
    appliedDate: "15 ago 2025",
    location: "San Isidro, Lima",
  },
  {
    id: "a4",
    jobTitle: "DevOps Engineer",
    company: "CloudSystems PE",
    status: "rejected",
    appliedDate: "10 ago 2025",
    location: "Remoto",
  },
  {
    id: "a5",
    jobTitle: "Data Scientist Jr.",
    company: "DataLab Perú",
    status: "hired",
    appliedDate: "5 ago 2025",
    location: "Miraflores, Lima",
  },
];

export const COMPANY_JOBS: CompanyJob[] = [
  { id: "j1", title: "Senior React Developer", location: "Remoto", applicants: 47, status: "active", daysLeft: 12, remote: true },
  { id: "j1b", title: "QA Engineer", location: "San Isidro, Lima", applicants: 18, status: "active", daysLeft: 6, remote: false },
  { id: "j1c", title: "Product Manager", location: "Remoto", applicants: 31, status: "active", daysLeft: 18, remote: true },
  { id: "j1d", title: "UX Designer", location: "Miraflores, Lima", applicants: 24, status: "paused", daysLeft: 0, remote: false },
];

export const MANAGED_JOBS: ManagedJob[] = [
  { id: "j1", title: "Senior React Developer", status: "active", applicants: 11, publishedDate: "12 sep 2026", closeDate: "26 sep 2026", daysLeft: 12, hireLimit: 2 },
  { id: "j1b", title: "QA Engineer", status: "active", applicants: 5, publishedDate: "14 sep 2026", closeDate: "20 sep 2026", daysLeft: 6, hireLimit: 1 },
  { id: "j1c", title: "Product Manager", status: "active", applicants: 4, publishedDate: "10 sep 2026", closeDate: "28 sep 2026", daysLeft: 18, hireLimit: 1 },
  { id: "j1d", title: "UX Designer", status: "paused", applicants: 4, publishedDate: "5 sep 2026", closeDate: "19 sep 2026", daysLeft: 0, hireLimit: 1 },
  { id: "j2", title: "Data Scientist Jr.", status: "paused", applicants: 4, publishedDate: "8 sep 2026", closeDate: "22 sep 2026", daysLeft: 9, hireLimit: 1 },
  { id: "j3", title: "DevOps Engineer Cloud", status: "approved_pending_payment", applicants: 0, publishedDate: "Hoy", closeDate: "En 14 días", daysLeft: 14, hireLimit: 1 },
  { id: "j4", title: "Backend Developer Node.js", status: "active", applicants: 6, publishedDate: "1 sep 2026", closeDate: "15 sep 2026", daysLeft: 2, hireLimit: 3 },
  { id: "j5", title: "Analista QA Automation", status: "pending_review", applicants: 0, publishedDate: "Hoy", closeDate: "En 14 días", daysLeft: 14, hireLimit: 1 },
  { id: "j6", title: "Ejecutivo Comercial Senior", status: "rejected_by_moderation", moderationReason: "Requisitos discriminatorios y rango salarial no especificado", applicants: 0, publishedDate: "Ayer", closeDate: "En 10 días", daysLeft: 10, hireLimit: 1 },
  { id: "j7", title: "Full Stack Engineer", status: "closed", applicants: 4, publishedDate: "15 ago 2026", closeDate: "29 ago 2026", daysLeft: 0, hireLimit: 1 },
];

/** Idioma registrado por el candidato en su perfil (la empresa solo lo consulta) */
export interface IdiomaCandidato {
  idioma: string;
  nivelEscrito: string;
  nivelOral: string;
}

export interface KanbanCandidate {
  id: string;
  jobId?: string;
  name: string;
  skills: string[];
  match: number;
  column: KanbanColumn;
  appliedDate: string;
  email: string;
  phone: string;
  experience: string;
  education: string;
  bio: string;
  /** Idiomas tal como están en el perfil del candidato: solo lectura */
  languages?: IdiomaCandidato[];
  rejectReason?: string;
}

export const KANBAN_CANDIDATES: KanbanCandidate[] = [
  {
    id: "k1",
    jobId: "j1",
    name: "Andrés Cárdenas",
    skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    match: 92,
    column: "received",
    appliedDate: "21 ago 2025",
    email: "a.cardenas@correo.com",
    phone: "+51 999 123 456",
    experience: "5 años en desarrollo frontend",
    education: "Ing. Sistemas – UNI",
    bio: "Desarrollador apasionado por crear interfaces rápidas y accesibles. Lideré el frontend de 3 productos SaaS en producción.",
  },
  {
    id: "k2",
    jobId: "j1",
    name: "María Torres",
    skills: ["React", "Vue.js", "TypeScript", "CSS"],
    match: 78,
    column: "received",
    appliedDate: "20 ago 2025",
    email: "m.torres@mail.pe",
    phone: "+51 987 654 321",
    experience: "3 años en frontend",
    education: "Ing. Computación – PUCP",
    bio: "Me especializo en design systems y accesibilidad. Fan de la documentación y las pruebas unitarias.",
  },
  {
    id: "k3",
    jobId: "j1",
    name: "José Luis Ramírez",
    skills: ["React", "Node.js", "AWS", "Docker"],
    match: 85,
    column: "received",
    appliedDate: "19 ago 2025",
    email: "jlramirez@dev.pe",
    phone: "+51 966 789 012",
    experience: "6 años full stack",
    education: "Ing. Software – UPC",
    bio: "Arquitectura de sistemas distribuidos y microservicios. Certificado AWS Solutions Architect.",
  },
  {
    id: "k4",
    jobId: "j1",
    name: "Ana Patricia Gutiérrez",
    skills: ["React", "TypeScript", "Next.js", "PostgreSQL", "GraphQL"],
    match: 95,
    column: "review",
    appliedDate: "18 ago 2025",
    email: "ana.g@techmail.com",
    phone: "+51 944 321 098",
    experience: "7 años senior frontend",
    education: "Ing. Informática – UTEC",
    bio: "Contribuidora open-source activa. Experiencia liderando equipos de 20+ personas en productos de alto tráfico.",
  },
  {
    id: "k5",
    jobId: "j1",
    name: "Miguel Sánchez",
    skills: ["React", "TypeScript", "Testing", "CI/CD"],
    match: 80,
    column: "review",
    appliedDate: "17 ago 2025",
    email: "miguel.s@email.com",
    phone: "+51 933 210 987",
    experience: "4 años frontend",
    education: "Ing. Sistemas – UTP",
    bio: "Enfocado en calidad y testing. Jest, Cypress y RTL son mi especialidad.",
  },
  {
    id: "k6",
    jobId: "j1",
    name: "Fátima Núñez",
    skills: ["React", "TypeScript", "Redux", "Next.js"],
    match: 88,
    column: "review",
    appliedDate: "16 ago 2025",
    email: "fatima.n@nexo.pe",
    phone: "+51 922 109 876",
    experience: "5 años en startups",
    education: "Sistemas – USIL",
    bio: "Experiencia en 2 startups que llegaron a Series B. Acostumbrada a iterar rápido con calidad.",
  },
  {
    id: "k7",
    jobId: "j1",
    name: "Luis Ríos",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
    match: 76,
    column: "interview",
    appliedDate: "14 ago 2025",
    email: "l.rios@dev.com",
    phone: "+51 911 098 765",
    experience: "4 años full stack",
    education: "Ciencias de la Computación – PUCP",
    bio: "Perfil versátil con experiencia en front y back. Me adapto rápido a nuevas tecnologías.",
  },
  {
    id: "k8",
    jobId: "j1",
    name: "Patricia Gómez",
    skills: ["React", "TypeScript", "Next.js", "Figma"],
    match: 91,
    column: "interview",
    appliedDate: "13 ago 2025",
    email: "p.gomez@talent.pe",
    phone: "+51 900 987 654",
    experience: "6 años frontend + design",
    education: "Diseño Digital – UP",
    bio: "Bridge entre diseño e ingeniería. Manejo Figma y código a nivel profesional.",
  },
  {
    id: "k9",
    jobId: "j1",
    name: "Roberto Castro",
    skills: ["React", "TypeScript", "Performance", "Web APIs"],
    match: 82,
    column: "hired",
    appliedDate: "10 ago 2025",
    email: "r.castro@hired.com",
    phone: "+51 988 876 543",
    experience: "8 años senior",
    education: "Ing. Electrónica – UNI",
    bio: "Especialista en optimización de rendimiento. Reduje el TTI de un producto de 8s a 1.2s.",
  },
  {
    id: "k10",
    jobId: "j1",
    name: "Valeria Cruz",
    skills: ["React", "TypeScript", "Tailwind", "Storybook"],
    match: 74,
    column: "rejected",
    appliedDate: "8 ago 2025",
    email: "v.cruz@mail.com",
    phone: "+51 977 765 432",
    experience: "2 años junior",
    education: "Ing. Sistemas – UNMSM",
    bio: "Candidata con potencial pero experiencia insuficiente para el nivel senior requerido.",
  },
  {
    id: "k11",
    jobId: "j1",
    name: "Daniel Vargas",
    skills: ["React", "JavaScript", "CSS"],
    match: 58,
    column: "rejected",
    appliedDate: "7 ago 2025",
    email: "d.vargas@email.pe",
    phone: "+51 966 654 321",
    experience: "1 año junior",
    education: "Autodidacta",
    bio: "Perfil interesante pero sin TypeScript ni herramientas modernas de build.",
  },

  // j4: Backend Developer Node.js
  {
    id: "k12",
    jobId: "j4",
    name: "Carlos Benítez",
    skills: ["Node.js", "TypeScript", "NestJS", "PostgreSQL"],
    match: 94,
    column: "review",
    appliedDate: "14 sep 2026",
    email: "c.benitez@node.pe",
    phone: "+51 912 345 678",
    experience: "5 años backend",
    education: "Ing. Sistemas – UNI",
    bio: "Especialista en microservicios con NestJS y bases de datos relacionales de alto tráfico.",
  },
  {
    id: "k13",
    jobId: "j4",
    name: "Gianfranco Rossi",
    skills: ["Node.js", "Express", "MongoDB", "Redis"],
    match: 89,
    column: "interview",
    appliedDate: "13 sep 2026",
    email: "g.rossi@tech.pe",
    phone: "+51 923 456 789",
    experience: "4 años backend",
    education: "Ing. Software – UPC",
    bio: "Arquitectura escalable en la nube, optimización de consultas y caché con Redis.",
  },
  {
    id: "k14",
    jobId: "j4",
    name: "Diana Paredes",
    skills: ["Node.js", "AWS", "Docker", "Kubernetes", "TypeScript"],
    match: 92,
    column: "received",
    appliedDate: "15 sep 2026",
    email: "d.paredes@dev.pe",
    phone: "+51 934 567 890",
    experience: "6 años backend cloud",
    education: "Ciencias de la Computación – PUCP",
    bio: "Experiencia en plataformas fintech con Node.js y despliegues automatizados en AWS EKS.",
  },
  {
    id: "k15",
    jobId: "j4",
    name: "Renato Medina",
    skills: ["Node.js", "TypeScript", "GraphQL", "Jest"],
    match: 81,
    column: "received",
    appliedDate: "12 sep 2026",
    email: "r.medina@mail.com",
    phone: "+51 945 678 901",
    experience: "3 años backend",
    education: "Ing. Informática – UTEC",
    bio: "Enfocado en TDD, APIs limpias con GraphQL y arquitectura hexagonal.",
  },
  {
    id: "k16",
    jobId: "j4",
    name: "Stephanie Alarcón",
    skills: ["Node.js", "PostgreSQL", "Docker", "TypeScript"],
    match: 86,
    column: "hired",
    appliedDate: "10 sep 2026",
    email: "s.alarcon@inbox.pe",
    phone: "+51 956 789 012",
    experience: "5 años backend",
    education: "Ing. Sistemas – UNMSM",
    bio: "Procesamiento de eventos en tiempo real con microservicios en Node.js.",
  },
  {
    id: "k17",
    jobId: "j4",
    name: "Jorge Quispe",
    skills: ["JavaScript", "Express", "MySQL"],
    match: 62,
    column: "rejected",
    appliedDate: "8 sep 2026",
    email: "j.quispe@correo.pe",
    phone: "+51 967 890 123",
    experience: "2 años junior",
    education: "Computación e Informática – Cibertec",
    bio: "Desarrollador enfocado en JavaScript vanilla y Express tradicional.",
    rejectReason: "No cumple con las habilidades técnicas (requiere TypeScript)",
  },

  // j2: Data Scientist Jr.
  {
    id: "k18",
    jobId: "j2",
    name: "Kevin Salazar",
    skills: ["Python", "SQL", "Pandas", "Scikit-learn"],
    match: 90,
    column: "interview",
    appliedDate: "10 sep 2026",
    email: "k.salazar@data.pe",
    phone: "+51 978 901 234",
    experience: "2 años en analítica de datos",
    education: "Estadística – UNALM",
    bio: "Modelado predictivo, limpieza y estructuración de datos para modelos de clasificación y regresión.",
  },
  {
    id: "k19",
    jobId: "j2",
    name: "Lucía Mendoza",
    skills: ["Python", "Machine Learning", "Power BI", "SQL"],
    match: 88,
    column: "review",
    appliedDate: "9 sep 2026",
    email: "l.mendoza@analytics.pe",
    phone: "+51 989 012 345",
    experience: "2 años data science",
    education: "Ing. Industrial – PUCP",
    bio: "Dashboards ejecutivos con Power BI y pipelines de análisis de datos con Python.",
  },
  {
    id: "k20",
    jobId: "j2",
    name: "Andrea Espinoza",
    skills: ["Python", "Pandas", "Machine Learning", "SQL"],
    match: 93,
    column: "received",
    appliedDate: "11 sep 2026",
    email: "a.espinoza@ai.pe",
    phone: "+51 990 123 456",
    experience: "1.5 años en investigación",
    education: "Ciencia de Datos – UTEC",
    bio: "Proyectos de deep learning con TensorFlow y análisis exploratorio riguroso.",
  },
  {
    id: "k21",
    jobId: "j2",
    name: "Bruno Morales",
    skills: ["Python", "Excel"],
    match: 60,
    column: "rejected",
    appliedDate: "7 sep 2026",
    email: "b.morales@mail.pe",
    phone: "+51 901 234 567",
    experience: "Practicante",
    education: "Economía – UP",
    bio: "Manejo intermedio de Python para scripts de automatización.",
    rejectReason: "No cumple con la experiencia requerida",
  },

  // j7: Full Stack Engineer
  {
    id: "k22",
    jobId: "j7",
    name: "Rodrigo Vega",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    match: 91,
    column: "hired",
    appliedDate: "18 ago 2026",
    email: "r.vega@hired.pe",
    phone: "+51 912 233 445",
    experience: "5 años full stack",
    education: "Ing. Software – UPC",
    bio: "Contratado para el equipo de core banking. Experiencia completa en front y back.",
  },
  {
    id: "k23",
    jobId: "j7",
    name: "Camila Ortiz",
    skills: ["Angular", "Java", "Docker", "TypeScript"],
    match: 84,
    column: "review",
    appliedDate: "17 ago 2026",
    email: "c.ortiz@corp.pe",
    phone: "+51 923 344 556",
    experience: "4 años full stack",
    education: "Ing. Sistemas – PUCP",
    bio: "Especialista en sistemas corporativos con Angular y Spring Boot.",
  },
  {
    id: "k24",
    jobId: "j7",
    name: "Javier Bazán",
    skills: ["Vue.js", "Node.js", "MongoDB"],
    match: 78,
    column: "interview",
    appliedDate: "16 ago 2026",
    email: "j.bazan@dev.com",
    phone: "+51 934 455 667",
    experience: "3 años full stack",
    education: "Ing. Informática – UTP",
    bio: "Desarrollo ágil de aplicaciones web modernas.",
  },
  {
    id: "k25",
    jobId: "j7",
    name: "Melissa Campos",
    skills: ["React", "Node.js", "Laravel"],
    match: 68,
    column: "rejected",
    appliedDate: "15 ago 2026",
    email: "m.campos@mail.pe",
    phone: "+51 945 566 778",
    experience: "3 años",
    education: "Ing. Sistemas – USIL",
    bio: "Desarrollo en stack LAMP y React.",
    rejectReason: "Expectativa salarial fuera de rango",
  },

  // j1b: QA Engineer
  {
    id: "k26",
    jobId: "j1b",
    name: "Marcos Díaz",
    skills: ["Selenium", "Cypress", "Postman", "Jest"],
    match: 94,
    column: "review",
    appliedDate: "18 sep 2026",
    email: "m.diaz@qa.pe",
    phone: "+51 911 223 344",
    experience: "4 años en testing automatizado",
    education: "Ing. de Software – UPC",
    bio: "Especialista en automatización con Cypress y Selenium WebDriver.",
  },
  {
    id: "k27",
    jobId: "j1b",
    name: "Luciana Flores",
    skills: ["Cypress", "Jest", "Automation", "CI/CD"],
    match: 89,
    column: "interview",
    appliedDate: "17 sep 2026",
    email: "l.flores@tester.pe",
    phone: "+51 922 334 455",
    experience: "3 años en QA automation",
    education: "Ing. de Sistemas – PUCP",
    bio: "Diseño de suites de pruebas E2E y pipelines de CI/CD.",
  },
  {
    id: "k28",
    jobId: "j1b",
    name: "Esteban Vega",
    skills: ["Selenium", "Automation", "Postman"],
    match: 81,
    column: "received",
    appliedDate: "16 sep 2026",
    email: "e.vega@mail.com",
    phone: "+51 933 445 566",
    experience: "2 años en pruebas funcionales y automatizadas",
    education: "Ing. Informática – UNI",
    bio: "Experiencia en pruebas de APIs con Postman y automatización web.",
  },
  {
    id: "k29",
    jobId: "j1b",
    name: "Valeria Mendoza",
    skills: ["Cypress", "Selenium", "Jest", "Automation"],
    match: 95,
    column: "hired",
    appliedDate: "15 sep 2026",
    email: "v.mendoza@qa.pe",
    phone: "+51 944 556 677",
    experience: "5 años liderando equipos de QA",
    education: "Ing. de Sistemas – UNMSM",
    bio: "QA Lead con experiencia en proyectos fintech.",
  },
  {
    id: "k30",
    jobId: "j1b",
    name: "Rodrigo Peña",
    skills: ["Manual Testing", "Postman"],
    match: 62,
    column: "rejected",
    appliedDate: "14 sep 2026",
    email: "r.pena@testing.com",
    phone: "+51 955 667 788",
    experience: "1 año en QA manual",
    education: "Computación e Informática – Cibertec",
    bio: "Pruebas manuales y documentación de casos de prueba.",
    rejectReason: "No cumple con las habilidades técnicas",
  },

  // j1c: Product Manager
  {
    id: "k31",
    jobId: "j1c",
    name: "Claudia Ramos",
    skills: ["Product Management", "Scrum", "Analytics", "Jira"],
    match: 93,
    column: "review",
    appliedDate: "16 sep 2026",
    email: "c.ramos@product.pe",
    phone: "+51 966 778 899",
    experience: "5 años como Product Manager en startups",
    education: "Administración y Sistemas – UPC",
    bio: "Definición de roadmap, priorización de backlog y análisis de métricas de retención.",
  },
  {
    id: "k32",
    jobId: "j1c",
    name: "Gabriel Salas",
    skills: ["Product Management", "Roadmaps", "Agile", "Analytics"],
    match: 88,
    column: "interview",
    appliedDate: "15 sep 2026",
    email: "g.salas@corp.pe",
    phone: "+51 977 889 900",
    experience: "4 años gestionando productos digitales B2B",
    education: "Ing. Industrial – PUCP",
    bio: "Liderazgo de equipos multidisciplinarios bajo metodologías ágiles.",
  },
  {
    id: "k33",
    jobId: "j1c",
    name: "Melissa Chávez",
    skills: ["Scrum", "Product Management", "Jira", "Roadmaps"],
    match: 82,
    column: "received",
    appliedDate: "14 sep 2026",
    email: "m.chavez@fintech.pe",
    phone: "+51 988 990 011",
    experience: "3 años en gestión de producto",
    education: "Ing. Comercial – Universidad del Pacífico",
    bio: "Experiencia en productos B2C de e-commerce y billeteras digitales.",
  },
  {
    id: "k34",
    jobId: "j1c",
    name: "Álvaro Rivas",
    skills: ["Product Management", "Analytics"],
    match: 65,
    column: "rejected",
    appliedDate: "12 sep 2026",
    email: "a.rivas@digital.pe",
    phone: "+51 999 001 122",
    experience: "2 años en producto",
    education: "Marketing – UDEP",
    bio: "Enfocado en marketing de producto y adquisición.",
    rejectReason: "No cumple con la experiencia requerida",
  },

  // j1d: UX Designer
  {
    id: "k35",
    jobId: "j1d",
    name: "Sofía Palacios",
    skills: ["Figma", "UX Research", "Design Systems", "Wireframing"],
    match: 96,
    column: "interview",
    appliedDate: "10 sep 2026",
    email: "s.palacios@design.pe",
    phone: "+51 911 002 233",
    experience: "4 años diseñando experiencias digitales",
    education: "Diseño Gráfico / UX – Toulouse Lautrec",
    bio: "Creación y mantenimiento de design systems a escala y pruebas de usabilidad.",
  },
  {
    id: "k36",
    jobId: "j1d",
    name: "Diego Hurtado",
    skills: ["Figma", "Prototyping", "UX Research", "Design Systems"],
    match: 86,
    column: "received",
    appliedDate: "09 sep 2026",
    email: "d.hurtado@ux.pe",
    phone: "+51 922 113 344",
    experience: "3 años en UI/UX",
    education: "Diseño y Comunicación – UPC",
    bio: "Prototipado interactivo de alta fidelidad y entrevistas con usuarios.",
  },
  {
    id: "k37",
    jobId: "j1d",
    name: "Andrea Montenegro",
    skills: ["Figma", "UX Research", "Wireframing"],
    match: 79,
    column: "received",
    appliedDate: "08 sep 2026",
    email: "a.montenegro@creativa.pe",
    phone: "+51 933 224 455",
    experience: "2 años en diseño UX",
    education: "Artes Digitales – PUCP",
    bio: "Especializada en research cualitativo y flujos de usuario.",
  },
  {
    id: "k38",
    jobId: "j1d",
    name: "Camila Barrientos",
    skills: ["Design Systems", "Prototyping", "Figma", "UX Research"],
    match: 94,
    column: "hired",
    appliedDate: "05 sep 2026",
    email: "c.barrientos@hired.pe",
    phone: "+51 944 335 566",
    experience: "5 años en producto digital y UX",
    education: "Diseño de Interacción – Toulouse Lautrec",
    bio: "Diseñadora contratada para liderar el rediseño del portal empresarial.",
  },
];

export type ReportStatus = "pending" | "unpublished" | "approved";

export interface ReportedJob {
  id: string;
  title: string;
  company: string;
  reportedAt: string;
  reason: string;
  status: ReportStatus;
  unpublishReason?: string;
}

export const INITIAL_REPORTS: ReportedJob[] = [
  {
    id: "r1",
    title: "Analista de Marketing Digital",
    company: "Growth Partners SAC",
    reportedAt: "12 Oct 2026",
    reason: "Contenido engañoso",
    status: "pending",
  },
  {
    id: "r2",
    title: "Desarrollador PHP Senior",
    company: "Nexus Digital SRL",
    reportedAt: "11 Oct 2026",
    reason: "Salario no especificado correctamente",
    status: "pending",
  },
  {
    id: "r3",
    title: "Ejecutivo de Ventas",
    company: "Distribuidora Lima SA",
    reportedAt: "10 Oct 2026",
    reason: "Requisitos discriminatorios",
    status: "pending",
  },
  {
    id: "r4",
    title: "Practicante de Contabilidad",
    company: "Auditores & Asociados",
    reportedAt: "09 Oct 2026",
    reason: "Modalidad laboral incorrecta",
    status: "approved",
  },
  {
    id: "r5",
    title: "Community Manager",
    company: "Agencia Creativa 360",
    reportedAt: "08 Oct 2026",
    reason: "Contacto externo sospechoso",
    status: "unpublished",
    unpublishReason: "La oferta solicitaba pagos al candidato para acceder al proceso.",
  },
];
