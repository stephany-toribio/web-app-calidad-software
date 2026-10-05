import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import { CandidatoRegistrado, RegistroCandidatoPayload } from './models/registro-candidato.model';

@Injectable({ providedIn: 'root' })
export class CandidatosService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/candidatos`;

    /**
     * Laravel Precognition: valida solo los campos indicados SIN guardar nada.
     * 204 => válido. 422 (o 400 si hay más de 15 habilidades) => error con el formato ApiError.
     */
    validarPaso(payload: Partial<RegistroCandidatoPayload>, campos: string[]): Observable<void> {
        const headers = new HttpHeaders({
            Precognition: 'true',
            'Precognition-Validate-Only': campos.join(','),
        });
        return this.http.post<void>(this.url, payload, { headers });
    }

    /** Registro final (paso 4): valida todo de nuevo y crea el candidato. 201 => registrado */
    registrar(payload: RegistroCandidatoPayload): Observable<CandidatoRegistrado> {
        return this.http
            .post<ApiResponse<CandidatoRegistrado>>(this.url, payload)
            .pipe(map(respuesta => respuesta.data));
    }
}
