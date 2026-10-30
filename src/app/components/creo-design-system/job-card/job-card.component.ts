import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job, avatarColor, companyInitial, rangoPostulaciones } from '../../../data/creo-data';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-card.component.html',
  styleUrl: './job-card.component.css'
})
export class JobCardComponent {
  @Input({ required: true }) job!: Job;
  @Input() saved = false;
  @Input() applied = false;
  @Input() compact = false;

  @Output() toggleSave = new EventEmitter<string>();
  @Output() viewDetail = new EventEmitter<string>();

  get avatarBg(): string {
    return avatarColor(this.job.company);
  }

  get initial(): string {
    return companyInitial(this.job.company);
  }

  get applicantRange(): string {
    return this.job.postulantesAprox ?? rangoPostulaciones(this.job.applicants);
  }

  onSaveClick(e: Event): void {
    e.stopPropagation();
    this.toggleSave.emit(this.job.id);
  }

  onCardClick(): void {
    this.viewDetail.emit(this.job.id);
  }
}
