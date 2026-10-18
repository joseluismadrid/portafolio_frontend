import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';

import { environment } from '../../../env/environment';
import { Contact } from './contact';

const CONTACT_URL = `${environment.apiUrl}/contact/`;

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    // SweetAlert2 se sustituye para no depender de su renderizado en el DOM.
    vi.spyOn(Swal, 'fire').mockImplementation(() => Promise.resolve(undefined as never));

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function fillValidForm(): void {
    component.nombre.setValue('Ana López');
    component.email.setValue('ana@example.com');
    component.servicio.setValue(component.servicios[0]);
    component.mensaje.setValue('Necesito una aplicación web para mi negocio.');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate max length for form controls', () => {
    component.nombre.setValue('a'.repeat(101));
    expect(component.nombre.errors?.['maxlength']).toBeTruthy();

    component.email.setValue('a'.repeat(95) + '@a.com');
    expect(component.email.errors?.['maxlength']).toBeTruthy();

    component.mensaje.setValue('a'.repeat(2001));
    expect(component.mensaje.errors?.['maxlength']).toBeTruthy();
  });

  it('should mark every control as touched when submitting an invalid form', () => {
    component.enviar();

    expect(component.contactForm.controls.nombre.touched).toBe(true);
    expect(component.contactForm.controls.email.touched).toBe(true);
    expect(component.contactForm.controls.servicio.touched).toBe(true);
    expect(component.contactForm.controls.mensaje.touched).toBe(true);
    httpMock.expectNone(CONTACT_URL);
  });

  it('should expose a single, ordered error message per field', () => {
    expect(component.nombreError).toBeNull();

    component.contactForm.markAllAsTouched();
    expect(component.nombreError).toBe('El nombre es obligatorio.');

    component.nombre.setValue('ab');
    expect(component.nombreError).toBe('Mínimo 3 caracteres.');

    component.nombre.setValue('Ana123');
    expect(component.nombreError).toBe('Solo se permiten letras y espacios.');

    component.email.setValue('sin-arroba');
    expect(component.emailError).toBe('Ingresa un correo válido.');

    component.mensaje.setValue('corto');
    expect(component.mensajeError).toBe('El mensaje es demasiado corto.');

    expect(component.servicioError).toBe('Debes seleccionar un servicio.');
  });

  it('should post the form value and clear the form on success', () => {
    fillValidForm();

    component.enviar();

    expect(component.loading()).toBe(true);

    const request = httpMock.expectOne(CONTACT_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Ana López',
      email: 'ana@example.com',
      servicio: component.servicios[0],
      mensaje: 'Necesito una aplicación web para mi negocio.',
    });

    request.flush({ message: 'ok' });

    expect(component.loading()).toBe(false);
    expect(component.contactForm.getRawValue()).toEqual({
      nombre: '',
      email: '',
      servicio: '',
      mensaje: '',
    });
  });

  it('should keep the entered data when the request fails', () => {
    fillValidForm();

    component.enviar();

    httpMock
      .expectOne(CONTACT_URL)
      .flush('error', { status: 500, statusText: 'Internal Server Error' });

    expect(component.loading()).toBe(false);
    expect(component.contactForm.getRawValue()).toEqual({
      nombre: 'Ana López',
      email: 'ana@example.com',
      servicio: component.servicios[0],
      mensaje: 'Necesito una aplicación web para mi negocio.',
    });
    expect(Swal.fire).toHaveBeenCalled();
  });
});
