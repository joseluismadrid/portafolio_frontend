import { Component, inject, signal } from '@angular/core';

import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';

import Swal from 'sweetalert2';

import { ContactService } from '../../shared/service/contact';
import { IContact } from '../../shared/interface/contact.interface';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, Loader],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly fb = inject(FormBuilder);

  private readonly contactService = inject(ContactService);

  /**
   * Estado de envío. Es un `signal` para que la vista se actualice sin
   * depender de `ChangeDetectorRef` en una aplicación sin zone.js.
   */
  public readonly loading = signal(false);

  public readonly servicios: string[] = [
    'Desarrollo de aplicación',
    'Desarrollo de sitios web',
    'Automatización de procesos',
    'APIs e integraciones',
    'Enviar hoja de vida',
  ];

  public readonly contactForm = this.fb.nonNullable.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern('^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'),
      ],
    ],

    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],

    servicio: ['', Validators.required],

    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  public enviar(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();

      return;
    }

    this.loading.set(true);

    const data: IContact = this.contactForm.getRawValue();

    this.contactService
      .contactame(data)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.exito();

          this.contactForm.reset();
        },

        // Ante un fallo se conserva lo que escribió la persona para que pueda
        // reintentar sin perder el mensaje.
        error: (error: HttpErrorResponse) => this.error(error),
      });
  }

  private exito(): void {
    Swal.fire({
      title: 'Mensaje enviado correctamente',
      icon: 'success',
      draggable: true,
    });
  }

  private error(error: HttpErrorResponse): void {
    console.error('Error al enviar mensaje:', error);

    Swal.fire({
      title: 'Error al enviar el mensaje',
      text: 'No fue posible conectar con el servidor. Intenta nuevamente.',
      icon: 'error',
      draggable: true,
    });
  }

  /** Primer mensaje de error aplicable, en el mismo orden que las reglas. */
  private errorMessage(
    control: AbstractControl,
    messages: readonly (readonly [string, string])[],
  ): string | null {
    if (!control.touched) {
      return null;
    }

    for (const [rule, message] of messages) {
      if (control.hasError(rule)) {
        return message;
      }
    }

    return null;
  }

  public get nombre(): AbstractControl {
    return this.contactForm.controls.nombre;
  }

  public get email(): AbstractControl {
    return this.contactForm.controls.email;
  }

  public get servicio(): AbstractControl {
    return this.contactForm.controls.servicio;
  }

  public get mensaje(): AbstractControl {
    return this.contactForm.controls.mensaje;
  }

  public get nombreError(): string | null {
    return this.errorMessage(this.contactForm.controls.nombre, [
      ['required', 'El nombre es obligatorio.'],
      ['minlength', 'Mínimo 3 caracteres.'],
      ['maxlength', 'Máximo 100 caracteres.'],
      ['pattern', 'Solo se permiten letras y espacios.'],
    ]);
  }

  public get emailError(): string | null {
    return this.errorMessage(this.contactForm.controls.email, [
      ['required', 'El correo es obligatorio.'],
      ['email', 'Ingresa un correo válido.'],
      ['maxlength', 'Máximo 100 caracteres.'],
    ]);
  }

  public get servicioError(): string | null {
    return this.errorMessage(this.contactForm.controls.servicio, [
      ['required', 'Debes seleccionar un servicio.'],
    ]);
  }

  public get mensajeError(): string | null {
    return this.errorMessage(this.contactForm.controls.mensaje, [
      ['required', 'El mensaje es obligatorio.'],
      ['minlength', 'El mensaje es demasiado corto.'],
      ['maxlength', 'El mensaje es demasiado largo (máximo 2000 caracteres).'],
    ]);
  }
}
