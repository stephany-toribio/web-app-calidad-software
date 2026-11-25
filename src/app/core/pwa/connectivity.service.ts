import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Only connection state and counters: never stores requests, tokens or form values. */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly onlineState = signal(navigator.onLine);
  private readonly pendingState = signal(0);
  private readonly messageState = signal('');
  readonly online = this.onlineState.asReadonly();
  readonly pendingWrites = this.pendingState.asReadonly();
  readonly message = this.messageState.asReadonly();
  readonly edited = signal(false);

  constructor() {
    const offline = () => this.onlineState.set(false);
    const online = () => {
      this.onlineState.set(true);
      this.messageState.set('La red volvió. No se reenviaron operaciones. Revisa el estado antes de repetir una operación o recarga para consultar datos actuales.');
    };
    const edit = () => this.edited.set(true);
    const leave = (event: BeforeUnloadEvent) => {
      if (this.edited() || this.pendingWrites() > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    window.addEventListener('beforeunload', leave);
    document.addEventListener('input', edit);
    document.addEventListener('change', edit);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
      window.removeEventListener('beforeunload', leave);
      document.removeEventListener('input', edit);
      document.removeEventListener('change', edit);
    });
  }

  beginWrite(): void { this.pendingState.update(value => value + 1); }
  endWrite(): void { this.pendingState.update(value => Math.max(0, value - 1)); }

  requestFailed(write: boolean): void {
    this.messageState.set(write
      ? 'No se pudo confirmar el resultado de la operación. No se reenviará automáticamente. Consulta su estado al recuperar la conexión antes de intentarlo otra vez.'
      : 'No se pudo consultar el servidor. Los datos en pantalla pueden estar desactualizados. Verifica la conexión y vuelve a consultar.');
  }

  dismissMessage(): void { this.messageState.set(''); }
}
