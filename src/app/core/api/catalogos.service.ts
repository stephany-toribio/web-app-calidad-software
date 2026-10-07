import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
    AreaEstudio, Carrera, Habilidad, Institucion, ItemCatalogo, Organizacion, TipoEstudio,
} from './models/catalogos.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
    private http = inject(HttpClient);
    private url = environment.apiUrl;

    // Catálogos fijos
    private paises$ = this.lista<ItemCatalogo>('paises').pipe(shareReplay(1));
    private tiposEstudio$ = this.lista<TipoEstudio>('tipos-estudio').pipe(shareReplay(1));
    private areasEstudio$ = this.lista<AreaEstudio>('areas-estudio').pipe(shareReplay(1));
    private idiomas$ = this.lista<ItemCatalogo>('idiomas').pipe(shareReplay(1));
    private puestos$ = this.lista<ItemCatalogo>('puestos').pipe(shareReplay(1));

    paises(): Observable<ItemCatalogo[]> { return this.paises$; }
    tiposEstudio(): Observable<TipoEstudio[]> { return this.tiposEstudio$; }
    areasEstudio(): Observable<AreaEstudio[]> { return this.areasEstudio$; }
    idiomas(): Observable<ItemCatalogo[]> { return this.idiomas$; }
    puestos(): Observable<ItemCatalogo[]> { return this.puestos$; }

    // Catálogos que dependen de lo elegido en el formulario
    instituciones(paisId?: number): Observable<Institucion[]> {
        return this.lista<Institucion>('instituciones', paisId ? new HttpParams().set('pais_id', paisId) : undefined);
    }


    organizaciones(paisId?: number): Observable<Organizacion[]> {
        return this.lista<Organizacion>('organizaciones', paisId ? new HttpParams().set('pais_id', paisId) : undefined);
    }

    carreras(tipoEstudioId: number, areaEstudioId: number, paisId: number): Observable<Carrera[]> {
        const params = new HttpParams()
            .set('tipo_estudio_id', tipoEstudioId)
            .set('area_estudio_id', areaEstudioId)
            .set('pais_id', paisId);
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
