import { Component } from '@angular/core';
import { Cards } from '../../shared/components/cards/cards';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BotonesRedes } from '../../shared/components/botones-redes/botones-redes';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Cards, CommonModule, RouterModule, BotonesRedes],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  contributions = [
    {
      titulo: 'Código limpio',
      descripcion: 'código que es fácil de leer, entender, mantener y modificar por cualquier desarrollador, no solo por su autor original.',
      imagen: 'assets/img/code.svg'
    },
    {
      titulo: 'Revisión de código',
      descripcion: 'Análisis y validación del código escrito por otros miembros del equipo para mantener estándares de calidad y seguridad.',
      imagen: 'assets/img/revision.png'
    },

    {
      titulo: 'Desarrollo Frontend y Backend',
      descripcion: 'Trabajan juntos mediante una conexión constante para procesar y mostrar la información al usuario.',
      imagen: 'assets/img/frontend.png'
    },
    {
      titulo: 'Arquitectura de Software',
      descripcion: 'Definición de los componentes, bases de datos y servicios en la nube necesarios para que el sistema soporte el crecimiento y la demanda.. ',
      imagen: 'assets/img/software.svg'
    },

    {
      titulo: 'Pruebas de rendimiento y seguridad',
      descripcion: 'Evaluaciones críticas dentro del Aseguramiento de Calidad (QA) que garantizan que el software sea rápido, estable y resistente a ataques antes de su lanzamiento al público',
      imagen: 'assets/img/seguridad.png'
    },
    {
      titulo: 'Diseño UI/UX',
      descripcion: 'Disciplina que define cómo se ve y cómo se siente un producto digital (como una aplicación, sitio web o software) al ser utilizado por una persona.',
      imagen: 'assets/img/experiencia.png'
    },
  ];

  Perfil =
    'Soy desarrollador de software Full Stack con conocimientos en desarrollo web, ensamble y mantenimiento de computadores. Me apasiona crear soluciones tecnológicas eficientes, aprender nuevas tecnologías y enfrentar desafíos que impulsen mi crecimiento profesional.'


}
