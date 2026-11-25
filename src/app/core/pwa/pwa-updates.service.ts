import { ApplicationRef, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter, take } from 'rxjs';
import { ConnectivityService } from './connectivity.service';
import { PWA_RELEASE } from './build-release';

@Injectable({ providedIn: 'root' })
export class PwaUpdatesService {
  private readonly updates = inject(SwUpdate);
  private readonly connection = inject(ConnectivityService);
  readonly enabled = this.updates.isEnabled;
  readonly release = PWA_RELEASE;
  readonly ready = signal(false);
  readonly unrecoverable = signal(false);
  readonly checking = signal(false);
  readonly notice = signal('');
  readonly version = signal('');
  readonly activeVersion = signal('');
  private updateOutcome = 0;

  constructor() {
    if (!this.enabled) return; // APK uses packaged assets; never web SW updates.
    const destroy = inject(DestroyRef);
    const subscription = this.updates.versionUpdates.subscribe(event => {
      if (event.type !== 'VERSION_DETECTED') this.updateOutcome++;
      if (event.type === 'VERSION_READY') {
        this.activeVersion.set(event.currentVersion.hash);
        this.version.set(event.latestVersion.hash);
        this.ready.set(true);
        this.notice.set('Hay una nueva versión lista. Puedes actualizar cuando termines de trabajar.');
      } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
        this.notice.set('La nueva versión no pudo descargarse. Puedes seguir en la versión actual y volver a comprobar más tarde.');
      } else if (event.type === 'NO_NEW_VERSION_DETECTED' && !this.ready() && !this.unrecoverable()) {
        // This event describes the latest installed version, NOT necessarily this tab.
        // Another tab may already have installed a different release.
        const appData = event.version.appData as Record<string, unknown> | undefined;
        const latestRelease = appData?.['release'];
        if (typeof latestRelease === 'string' && latestRelease !== this.release) {
          this.version.set(event.version.hash);
          this.ready.set(true);
          this.notice.set('Hay una nueva versión lista. Puedes actualizar cuando termines de trabajar.');
        } else {
          this.notice.set('No hay una nueva versión disponible.');
        }
      }
    });
    const broken = this.updates.unrecoverable.subscribe(() => {
      this.unrecoverable.set(true);
      this.notice.set('No se puede recuperar esta versión. Revisa tus formularios antes de recargar con conexión.');
    });
    // Do not start timers before Angular stabilizes, delaying SW registration.
    const stable = inject(ApplicationRef).isStable.pipe(filter(Boolean), take(1))
      .subscribe(() => { void this.check(); });
    const online = () => { void this.check(); };
    window.addEventListener('online', online);
    destroy.onDestroy(() => {
      subscription.unsubscribe();
      broken.unsubscribe();
      stable.unsubscribe();
      window.removeEventListener('online', online);
    });
  }

  async check(): Promise<void> {
    if (!this.enabled || this.checking() || !this.connection.online()) return;
    this.checking.set(true);
    const outcomeBefore = this.updateOutcome;
    try {
      const found = await this.updates.checkForUpdate();
      // Angular's worker can return false on fetch failure without a version event.
      // false alone must not be presented as a successful up-to-date check.
      if (!found && this.updateOutcome === outcomeBefore && !this.unrecoverable()) {
        this.notice.set('No se pudo comprobar la actualización. Vuelve a intentarlo con conexión.');
      }
    }
    catch { this.notice.set('No se pudo comprobar la actualización. Vuelve a intentarlo con conexión.'); }
    finally { this.checking.set(false); }
  }

  reload(): void {
    if (!this.connection.online() || this.connection.pendingWrites() > 0) return;
    // Always ask: custom forms may not expose Angular dirty state.
    if (!window.confirm('Se recargará la aplicación. Los datos de formularios sin guardar se perderán. ¿Quieres continuar?')) return;
    this.connection.edited.set(false);
    // Reload instead of activateUpdate(): do not mix lazy chunks across versions.
    window.location.reload();
  }
}
