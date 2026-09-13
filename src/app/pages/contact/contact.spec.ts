import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Contact } from './contact';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

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
});
