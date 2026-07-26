import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { IContact } from '../interface/contact.interface';
import { environment } from '../../../env/environment';


@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(
    private readonly http: HttpClient
  ) { }

  contactame(data: IContact): Observable<any> {

    return this.http.post<any>(

      `${environment.apiUrl}/contact/`,
      data

    );

  }

}
