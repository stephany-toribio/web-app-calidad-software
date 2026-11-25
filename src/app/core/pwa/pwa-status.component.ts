import { Component, inject } from '@angular/core';
import { ConnectivityService } from './connectivity.service';
import { PwaUpdatesService } from './pwa-updates.service';

@Component({
  selector: 'app-pwa-status',
  standalone: true,
  template: `
    @if (!connection.online()) {
      <section class="offline" role="alert" data-testid="offline-view">
        <h1>Sin conexión</h1>
        <p>Para consultar tus datos o enviar operaciones necesitas conexión.</p>
        <p>Las solicitudes nuevas no se enviarán ni se guardarán para reenvío automático.
          Si la conexión se perdió durante una operación, consulta su estado al volver.</p>
        <p>Los formularios abiertos se mantienen en esta ventana mientras no cierres ni recargues la aplicación.</p>
      </section>
    }
    @if (connection.online() && connection.message()) {
      <aside role="status" data-testid="network-notice">
        <p>{{ connection.message() }}</p>
        <button type="button" (click)="updates.reload()" [disabled]="connection.pendingWrites() > 0">Recargar datos</button>
        <button type="button" (click)="connection.dismissMessage()">Continuar sin recargar</button>
      </aside>
    }
    @if (connection.online() && updates.notice()) {
      <aside role="status" data-testid="update-notice" [attr.data-ready-version]="updates.version()">
        <p>{{ updates.notice() }}</p>
        @if (updates.ready() || updates.unrecoverable()) {
          <button type="button" (click)="updates.reload()" [disabled]="connection.pendingWrites() > 0">Actualizar y recargar</button>
          <p>Puedes terminar de editar antes de actualizar. No recargaremos automáticamente.</p>
        }
      </aside>
    }
    @if (connection.online() && updates.enabled) {
      <div class="check" [attr.data-active-release]="updates.release" [attr.data-active-version]="updates.activeVersion()"><button type="button" (click)="updates.check()" [disabled]="updates.checking()">Comprobar actualización</button></div>
    }
  `,
  styles: [`
    :host { display: block; font-family: inherit; color: #111; }
    section, aside { padding: 1rem; background: #fff7d6; border-bottom: 1px solid #d6b450; }
    .offline { min-height: 55vh; padding: 3rem 1.5rem; background: #fff; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; }
    p { margin: .5rem 0; max-width: 65rem; }
    button { padding: .5rem .75rem; margin: .25rem .5rem .25rem 0; border: 1px solid #947300; border-radius: .4rem; background: #fff; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .check { padding: .25rem 1rem; text-align: right; background: #fff; font-size: .8rem; }
  `]
})
export class PwaStatusComponent {
  readonly connection = inject(ConnectivityService);
  readonly updates = inject(PwaUpdatesService);
}
