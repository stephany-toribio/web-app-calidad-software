import { CREO_SECTORS } from '../../../data/creo-skills.data';
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  CompanyShellComponent
} from '../../../components/creo-design-system/company-shell/company-shell.component';

import {
  EmpresasService
} from '../../../core/api/empresas.service';

import {
  ActualizarEmpresaPayload,
  EmpresaRegistrada
} from '../../../core/api/models/registro-empresa.model';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CompanyShellComponent
  ],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.css'
})
export class CompanyProfileComponent implements OnInit, OnDestroy {

  private empresasService = inject(EmpresasService);
  private subs = new Subscription();

  empresa: EmpresaRegistrada | null = null;

  cargando = false;
  guardando = false;

  errorCarga = '';
  mensajeExito = '';

  errores: Record<string, string> = {};

  sectores = CREO_SECTORS;

  formulario = {
    encargado_empresa: '',
    razon_social: '',
    sector: '',
    ruc: '',
    sitio_web: '',
    descripcion: ''
  };

  ngOnInit(): void {
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargarPerfil(): void {
    if (this.cargando || this.guardando) return;

    this.cargando = true;
    this.errorCarga = '';
    this.mensajeExito = '';
    this.errores = {};

    this.subs.add(
      this.empresasService.miEmpresa().subscribe({
        next: empresa => {
          this.aplicarPerfil(empresa);
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
          this.errorCarga =
            'No fue posible cargar tu perfil empresarial. Inténtalo nuevamente.';
        }
      })
    );
  }

  private aplicarPerfil(empresa: EmpresaRegistrada): void {
    this.empresa = empresa;

    this.formulario = {
      encargado_empresa: empresa.encargado_empresa,
      razon_social: empresa.razon_social,
      sector: empresa.sector,
      ruc: empresa.ruc,
      sitio_web: empresa.sitio_web ?? '',
      descripcion: empresa.descripcion ?? ''
    };
  }

  cancelar(): void {
    if (this.guardando || this.cargando || !this.empresa) return;

    this.aplicarPerfil(this.empresa);
    this.errores = {};
    this.mensajeExito = '';
  }

  validar(): boolean {
    const errores: Record<string, string> = {};
    const f = this.formulario;

    if (!f.encargado_empresa.trim()) {
      errores['encargado_empresa'] =
        'El encargado es obligatorio.';
    } else if (f.encargado_empresa.trim().length > 255) {
      errores['encargado_empresa'] =
        'El encargado no debe superar los 255 caracteres.';
    }

    if (!f.razon_social.trim()) {
      errores['razon_social'] =
        'La razón social es obligatoria.';
    } else if (f.razon_social.trim().length > 255) {
      errores['razon_social'] =
        'La razón social no debe superar los 255 caracteres.';
    }

    if (!this.sectores.includes(f.sector)) {
      errores['sector'] = 'Selecciona un sector válido.';
    }

    if (!/^\d{11}$/.test(f.ruc.trim())) {
      errores['ruc'] = 'El RUC debe contener 11 dígitos.';
    }

    if (f.sitio_web.trim()) {
      try {
        const url = new URL(f.sitio_web.trim());

        if (!['http:', 'https:'].includes(url.protocol)) {
          errores['sitio_web'] =
            'Ingresa una dirección HTTP o HTTPS válida.';
        }
      } catch {
        errores['sitio_web'] =
          'Ingresa una dirección web válida.';
      }
    }

    if (f.sitio_web.trim().length > 255) {
      errores['sitio_web'] =
        'El sitio web no debe superar los 255 caracteres.';
    }

    if (f.descripcion.length > 250) {
      errores['descripcion'] =
        'La descripción no debe superar los 250 caracteres.';
    }

    this.errores = errores;

    return Object.keys(errores).length === 0;
  }

  guardar(): void {
    if (
      this.guardando ||
      this.cargando ||
      this.errorCarga ||
      !this.empresa
    ) return;

    this.mensajeExito = '';

    if (!this.validar()) return;

    const f = this.formulario;

    const payload: ActualizarEmpresaPayload = {
      encargado_empresa: f.encargado_empresa.trim(),
      razon_social: f.razon_social.trim(),
      sector: f.sector,
      ruc: f.ruc.trim(),
      sitio_web: f.sitio_web.trim() || null,
      descripcion: f.descripcion.trim() || null
    };

    this.guardando = true;

    this.subs.add(
      this.empresasService.actualizarMiEmpresa(payload)
        .subscribe({
          next: empresa => {
            this.aplicarPerfil(empresa);
            this.guardando = false;
            this.errores = {};
            this.mensajeExito =
              'Tu perfil empresarial se actualizó correctamente.';
          },
          error: (error: HttpErrorResponse) => {
            this.guardando = false;
            this.mapearErrores(error);
          }
        })
    );
  }

  private mapearErrores(error: HttpErrorResponse): void {
    const errores: Record<string, string> = {};

    if (error.status === 422 && error.error?.errors) {
      for (const [campo, mensajes] of Object.entries(
        error.error.errors
      )) {
        errores[campo] = Array.isArray(mensajes)
          ? String(mensajes[0])
          : String(mensajes);
      }
    }

    if (Object.keys(errores).length === 0) {
      errores['api'] = error.status === 0
        ? 'No se pudo conectar con el servidor.'
        : 'No fue posible guardar los cambios.';
    }

    this.errores = errores;
  }

  get iniciales(): string {
    return (this.empresa?.razon_social ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase();
  }
}
