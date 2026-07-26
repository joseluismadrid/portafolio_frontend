import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import {
  HttpErrorResponse
} from '@angular/common/http';

import Swal from 'sweetalert2';

import { ContactService } from '../../shared/service/contact';
import { IContact } from '../../shared/interface/contact.interface';
import { Loader } from '../../shared/components/loader/loader';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Loader
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {


  private readonly fb = inject(FormBuilder);

  private readonly contactService =
    inject(ContactService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  public loading = false;


  public readonly servicios: string[] = [

    'Desarrollo de aplicación',
    'Desarrollo de sitios web',
    'Automatización de procesos',
    'Base de datos',
    'APIs e integraciones',
    'Consultoria tecnológica',
    'Mantenimiento y soporte'

  ];


  public readonly contactForm =
    this.fb.nonNullable.group({

      nombre: [

        '',

        [

          Validators.required,
          Validators.minLength(3),

          Validators.pattern(
            '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$'
          )

        ]

      ],


      email: [

        '',

        [

          Validators.required,
          Validators.email

        ]

      ],


      servicio: [

        '',

        Validators.required

      ],


      mensaje: [

        '',

        [

          Validators.required,
          Validators.minLength(10)

        ]

      ]

    });



  public enviar(): void {


    if (this.contactForm.invalid) {

      this.contactForm.markAllAsTouched();

      return;

    }


    this.loading = true;


    const data: IContact =
      this.contactForm.getRawValue();



    this.contactService
      .contactame(data)

      .pipe(

        finalize(() => {

          this.loading = false;

          // fuerza actualización visual si hace falta
          this.cdr.detectChanges();

        })

      )


      .subscribe({

        next: () => {

          this.exito();

          this.contactForm.reset();

        },


        error: (error: HttpErrorResponse) => {

          this.error(error);
          this.contactForm.reset();

        }

      });


  }



  private exito(): void {


    Swal.fire({

      title: 'Mensaje enviado correctamente',

      icon: 'success',

      draggable: true

    });


  }



  private error(error: HttpErrorResponse): void {


    console.error(
      'Error al enviar mensaje:',
      error
    );


    Swal.fire({

      title: 'Error al enviar el mensaje',

      text:
        'No fue posible conectar con el servidor. Intenta nuevamente.',

      icon: 'error',

      draggable: true

    });


  }



  public get nombre() {

    return this.contactForm.controls.nombre;

  }


  public get email() {

    return this.contactForm.controls.email;

  }


  public get servicio() {

    return this.contactForm.controls.servicio;

  }


  public get mensaje() {

    return this.contactForm.controls.mensaje;

  }


}
