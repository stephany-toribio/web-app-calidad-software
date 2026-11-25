import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectivityService } from './core/pwa/connectivity.service';
import { PwaStatusComponent } from './core/pwa/pwa-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaStatusComponent],
  template: `
    <main class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <app-pwa-status></app-pwa-status>
      <!-- Keep the route alive to preserve forms in memory; hide private content offline. -->
      <div [hidden]="!connection.online()" [attr.inert]="!connection.online() ? '' : null">
        <router-outlet></router-outlet>
      </div>
    </main>
  `
})
export class AppComponent {
  readonly connection = inject(ConnectivityService);
  title = 'Creo Angular';
}
