import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { IContact } from '../interface/contact.interface';
import { environment } from '../../../env/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);

  /**
   * Envía el formulario de contacto.
   *
   * El backend no devuelve datos que la aplicación consuma, así que el tipo de
   * respuesta es `unknown` en lugar de `any`: obliga a comprobar el valor antes
   * de usarlo si algún día se necesita.
   */
  contactame(data: IContact): Observable<unknown> {
    return this.http.post<unknown>(`${environment.apiUrl}/contact/`, data);
  }
}
