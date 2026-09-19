import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-creo-step-indicator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creo-step-indicator.component.html',
    styleUrl: './creo-step-indicator.component.css'
})
export class CreoStepIndicatorComponent {
    @Input() steps: string[] = [];
    @Input() current: number = 0;

    isDone(i: number): boolean { return i < this.current; }
    isActive(i: number): boolean { return i === this.current; }
}