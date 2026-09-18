import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';

@Component({
    selector: 'app-creo-choose-role',
    standalone: true,
    imports: [CommonModule, CreoWordmarkComponent],
    templateUrl: './creo-choose-role.component.html',
    styleUrl: './creo-choose-role.component.css',
})
export class CreoChooseRoleComponent {
    private router = inject(Router);

    roles = [
        {
            id: 'candidate',
            title: 'Soy Candidato',
            sub: 'Busco empleo y quiero mostrar mis habilidades',
            route: 'register-candidate',
        },
        {
            id: 'company',
            title: 'Soy Empresa',
            sub: 'Quiero publicar vacantes y encontrar talento',
            route: 'register-company',
        },
    ];

    goTo(route: string) {
        this.router.navigate(['/creo', route]);
    }

    onCardEnter(e: MouseEvent) {
        const t = e.currentTarget as HTMLElement;
        t.style.borderColor = '#F2B705';
        t.style.boxShadow = '0 10px 25px -5px rgba(242,183,5,0.15), 0 8px 10px -6px rgba(242,183,5,0.1)';
    }

    onCardLeave(e: MouseEvent) {
        const t = e.currentTarget as HTMLElement;
        t.style.borderColor = '#E2E8F0';
        t.style.boxShadow = 'none';
    }
}