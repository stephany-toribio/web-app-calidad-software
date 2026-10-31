import { ManagedJob, ManagedJobStatus } from '../../../data/creo-data';
import { EstadoGeneralVacante, VacanteEmpresa } from '../models/vacante-empresa.model';

const ESTADOS: Record<EstadoGeneralVacante, ManagedJobStatus> = {
  publicada: 'active',
  por_iniciar: 'active',
  pausada: 'paused',
  finalizada: 'closed',
  vencida: 'closed',
  eliminada: 'inactive',
  pendiente_revision: 'pending_review',
  pendiente_pago: 'approved_pending_payment',
  no_aprobada: 'rejected_by_moderation',
};

// Traducción de la vacante de la API al formato que usan las pantallas de empresa
export function mapVacanteToManagedJob(v: VacanteEmpresa): ManagedJob {
  const status = ESTADOS[v.estado.general] ?? 'active';

  // QA-04: Fecha calendario local (evitar el desfase UTC de new Date("YYYY-MM-DD"))
  let closeDate = '';
  let daysLeft = 0;
  if (v.fecha_fin_vigencia) {
    const [y, m, d] = v.fecha_fin_vigencia.split('T')[0].split('-').map(Number);
    const closeLocal = new Date(y, m - 1, d);
    closeDate = closeLocal.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

    // La vigencia abarca todo el día calendario hasta las 23:59:59
    const finDia = new Date(y, m - 1, d, 23, 59, 59, 999);
    const diffTime = finDia.getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  let publishedDate = 'Sin publicar';
  if (v.estado.publicada_en) {
    const pub = new Date(v.estado.publicada_en);
    publishedDate = pub.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  let salary = 'A tratar';
  if (v.salario_min !== null && v.salario_max !== null) {
    salary = `S/ ${v.salario_min.toLocaleString()} – ${v.salario_max.toLocaleString()}`;
  }

  return {
    id: String(v.id),
    title: v.titulo,
    status,
    applicants: v.postulaciones_count ?? 0,
    publishedDate,
    closeDate,
    daysLeft,
    hireLimit: v.max_contrataciones,
    moderationReason: v.estado.motivo_no_aprobacion || undefined,
    description: v.descripcion,
    level: v.nivel_puesto?.nombre,
    requirements: v.requisitos ?? [],
    benefits: v.beneficios ?? [],
    location: v.ubicacion || (v.tipo_empleo === 'remoto' ? 'Remoto' : 'Lima, Perú'),
    salary,
    salaryMin: v.salario_min ?? undefined,
    salaryMax: v.salario_max ?? undefined,
    tags: v.habilidades?.map(h => h.nombre) || [],
    skillTags: v.habilidades?.map(h => ({
      skill: h.nombre,
      weight: h.requisito === 'must_have' ? 'required' : 'preferred'
    })) || [],
    remote: v.tipo_empleo === 'remoto',
    area: v.area_profesional?.nombre,
    modality: v.tipo_empleo === 'remoto' ? 'Remoto' : (v.tipo_empleo === 'hibrido' ? 'Híbrido' : 'Presencial'),
    closeDateISO: v.fecha_fin_vigencia
  };
}
