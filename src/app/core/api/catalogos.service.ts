import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
    AreaEstudio, Carrera, Habilidad, Institucion, ItemCatalogo, NivelPuestoSeleccionable, Organizacion, TipoEstudio,
} from './models/catalogos.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
    private http = inject(HttpClient);
    private url = environment.apiUrl;

    // Sin caché: cada llamada pide la lista actual. El admin puede desactivar elementos en cualquier momento
    // y una lista guardada para toda la sesión seguiría mostrándolos hasta recargar la página.
    paises(): Observable<ItemCatalogo[]> { return this.lista<ItemCatalogo>('paises'); }
    tiposEstudio(): Observable<TipoEstudio[]> { return this.lista<TipoEstudio>('tipos-estudio'); }
    areasEstudio(): Observable<AreaEstudio[]> { return this.lista<AreaEstudio>('areas-estudio'); }
    idiomas(): Observable<ItemCatalogo[]> { return this.lista<ItemCatalogo>('idiomas'); }
    puestos(): Observable<ItemCatalogo[]> { return this.lista<ItemCatalogo>('puestos'); }
    /** En orden jerárquico (Practicante → Gerente), tal como lo devuelve el backend */
    nivelesPuesto(): Observable<NivelPuestoSeleccionable[]> { return this.lista<NivelPuestoSeleccionable>('niveles-puesto'); }

    // Catálogos que dependen de lo elegido en el formulario
    instituciones(paisId?: number): Observable<Institucion[]> {
        return this.lista<Institucion>('instituciones', paisId ? new HttpParams().set('pais_id', paisId) : undefined);
    }


    organizaciones(paisId?: number): Observable<Organizacion[]> {
        return this.lista<Organizacion>('organizaciones', paisId ? new HttpParams().set('pais_id', paisId) : undefined);
    }

    /** Las carreras son globales: dependen solo del tipo de estudio */
    carreras(tipoEstudioId: number): Observable<Carrera[]> {
        const params = new HttpParams().set('tipo_estudio_id', tipoEstudioId);
        return this.lista<Carrera>('carreras', params);
    }

    habilidades(areaIds: number[] = []): Observable<Habilidad[]> {
        const params = new HttpParams({ fromObject: { 'areas[]': areaIds.map(String) } });
        return this.lista<Habilidad>('habilidades', params);
    }

    private lista<T>(ruta: string, params?: HttpParams): Observable<T[]> {
        return this.http
            .get<ApiResponse<T[]>>(`${this.url}/${ruta}`, { params })
            .pipe(map(respuesta => respuesta.data));
    }
}
