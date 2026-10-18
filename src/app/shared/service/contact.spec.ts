import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../env/environment';
import { IContact } from '../interface/contact.interface';
import { ContactService } from './contact';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST the contact data to the contact endpoint', () => {
    const data: IContact = {
      nombre: 'Ana López',
      email: 'ana@example.com',
      servicio: 'Desarrollo de aplicación',
      mensaje: 'Necesito una aplicación web para mi negocio.',
    };

    service.contactame(data).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/contact/`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(data);

    request.flush({ message: 'ok' });
  });
});
