import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import { CandidatoRegistrado, RegistroCandidatoPayload } from './models/registro-candidato.model';
import { CandidatoPerfil } from './models/candidato-perfil.model';
import { NivelPuestoSeleccionable, Organizacion, PuestoSeleccionable } from './models/catalogos.model';

@Injectable({ providedIn: 'root' })
export class CandidatosService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/candidatos`;


    validarPaso(payload: Partial<RegistroCandidatoPayload>, campos: string[]): Observable<void> {
        const headers = new HttpHeaders({
            Precognition: 'true',
            'Precognition-Validate-Only': campos.join(','),
        });
        return this.http.post<void>(this.url, payload, { headers });
    }

    /** Registro final (paso 4): valida todo de nuevo y crea el candidato. 201  */
    registrar(payload: RegistroCandidatoPayload): Observable<CandidatoRegistrado> {
        return this.http
            .post<ApiResponse<CandidatoRegistrado>>(this.url, payload)
            .pipe(map(respuesta => respuesta.data));
    }

    /** Perfil completo del candidato autenticado  */
    obtenerMiPerfil(): Observable<CandidatoPerfil> {
        return this.http
            .get<ApiResponse<CandidatoPerfil>>(`${this.url}/me`)
            .pipe(map(respuesta => respuesta.data));
    }

    /** Puestos que puede elegir el candidato autenticado: catálogo global + sus personalizados habilitados */
    misPuestos(): Observable<PuestoSeleccionable[]> {
        return this.http
            .get<ApiResponse<PuestoSeleccionable[]>>(`${this.url}/me/puestos`)
            .pipe(map(respuesta => respuesta.data));
    }

    /** Niveles que puede elegir el candidato autenticado: globales (en su orden) + sus personalizados habilitados */
    misNivelesPuesto(): Observable<NivelPuestoSeleccionable[]> {
        return this.http
            .get<ApiResponse<NivelPuestoSeleccionable[]>>(`${this.url}/me/niveles-puesto`)
            .pipe(map(respuesta => respuesta.data));
    }

    /** Organizaciones que puede elegir el candidato autenticado: catálogo global + sus personalizadas habilitadas */
    misOrganizaciones(paisId?: number): Observable<Organizacion[]> {
        const params = paisId ? new HttpParams().set('pais_id', paisId) : undefined;
        return this.http
            .get<ApiResponse<Organizacion[]>>(`${this.url}/me/organizaciones`, { params })
            .pipe(map(respuesta => respuesta.data));
    }

    /** Actualización parcial: cada sección enviada reemplaza a la guardada. Devuelve el perfil actualizado */
    actualizarMiPerfil(payload: Partial<RegistroCandidatoPayload>): Observable<CandidatoPerfil> {
        return this.http
            .put<ApiResponse<CandidatoPerfil>>(`${this.url}/me`, payload)
            .pipe(map(respuesta => respuesta.data));
    }
}
