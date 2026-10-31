import { Job } from '../../../data/creo-data';
import { VacanteBusqueda } from '../models/vacante-busqueda.model';

/** Adapta un resultado de la API a la tarjeta del design system */
export function mapVacanteBusquedaToJob(v: VacanteBusqueda): Job {
  const remoto = v.tipo_empleo === 'remoto';
  // Los dos salarios llegan con valor o los dos en null; null no significa 0
  const salary = v.salario_min !== null && v.salario_max !== null
    ? `S/ ${v.salario_min.toLocaleString('es-PE')} – ${v.salario_max.toLocaleString('es-PE')}`
    : 'A convenir';

  return {
    id: String(v.id),
    title: v.titulo,
    company: v.empresa.razon_social,
    companyDescription: v.empresa.sector,
    location: v.ubicacion || (remoto ? 'Remoto' : ''),
    remote: remoto,
    salary,
    salaryMin: v.salario_min ?? 0,
    salaryMax: v.salario_max ?? 0,
    tags: v.habilidades.map(h => h.nombre),
    postedAgo: haceCuanto(v.publicada_en),
    match: 0,
    experience: v.nivel_puesto.nombre,
    area: v.area_profesional.nombre,
    description: '',
    requirements: [],
    benefits: [],
    applicants: 0,
    postulantesAprox: v.postulantes_aprox,
    // QA-02: Al candidato no se le distingue internamente obligatoria vs deseable
    skillTags: v.habilidades.map(h => ({
      skill: h.nombre,
      weight: 'required' as const
    }))
  };
}

/** publicada_en llega en ISO-8601 UTC; se parsea con Date, nunca comparando texto */
function haceCuanto(iso: string): string {
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '';
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Hace 1 día';
  if (dias < 30) return `Hace ${dias} días`;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}
