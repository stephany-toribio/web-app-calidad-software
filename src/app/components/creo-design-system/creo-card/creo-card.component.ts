import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-creo-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creo-card.component.html',
    styleUrl: './creo-card.component.css'
})
export class CreoCardComponent {
    @Input() padding: boolean = true;
    @Input() className: string = '';
}