import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { JobCardComponent } from '../../../components/creo-design-system/job-card/job-card.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { Job } from '../../../data/creo-data';

@Component({
  selector: 'app-candidate-saved',
  standalone: true,
  imports: [CommonModule, CandidateShellComponent, JobCardComponent],
  templateUrl: './candidate-saved.component.html',
  styleUrl: './candidate-saved.component.css'
})
export class CandidateSavedComponent implements OnInit, OnDestroy {
  savedJobs: Job[] = [];
  savedJobIds: string[] = [];
  appliedJobIds: string[] = [];

  private subs = new Subscription();

  constructor(
    private creoJobsService: CreoJobsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      combineLatest([
        this.creoJobsService.publicJobs$,
        this.creoJobsService.saved$,
        this.creoJobsService.applied$,
      ]).subscribe(([jobs, savedIds, appliedIds]: [Job[], string[], string[]]) => {
        this.savedJobIds = savedIds;
        this.appliedJobIds = appliedIds;
        this.savedJobs = jobs.filter((j: Job) => savedIds.includes(j.id));
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onToggleSave(jobId: string): void {
    this.creoJobsService.toggleSave(jobId);
  }

  onViewDetail(jobId: string): void {
    this.router.navigate(['/creo/candidate-job-detail'], { queryParams: { id: jobId } });
  }

  exploreJobs(): void {
    this.router.navigate(['/creo/candidate-jobs']);
  }

  isApplied(jobId: string): boolean {
    return this.appliedJobIds.includes(jobId);
  }
}
