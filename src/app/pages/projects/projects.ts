import { Component } from '@angular/core';

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  proyecto = [
    {
      titulo: 'Optimización y Modernización de Interfaces Web',
      descripcion: 'Proyecto enfocado en la mejora de interfaces existentes mediante la implementación de diseño responsive, accesibilidad, optimización de rendimiento y estandarización de componentes visuales. Se logró una experiencia más consistente entre diferentes dispositivos y resoluciones.',
      tecnologias: ['Angular', 'SCSS', 'HTML5', 'TypeScript'],
      estado: 'Proyecto empresarial bajo acuerdo de confidencialidad (NDA).'
    },
    {
      titulo: 'Sistema de Gestión de Solicitudes Empresariales',
      descripcion: 'Aplicación web desarrollada para la administración y seguimiento de solicitudes internas. Participé en la construcción de componentes reutilizables, formularios dinámicos, validaciones avanzadas e integración con servicios REST. La solución fue diseñada bajo principios de accesibilidad, rendimiento y experiencia de usuario.',
      tecnologias: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'Docker', 'Nginx', 'Git'],
      estado: 'Proyecto empresarial bajo acuerdo de confidencialidad (NDA).'
    },
    {
      titulo: 'Plataforma de Administración Documental',
      descripcion: 'Sistema orientado a la gestión, consulta y organización de documentos digitales. Se implementaron módulos de búsqueda, visualización de información, manejo de estados y control de acceso basado en roles. El enfoque principal estuvo en la optimización de procesos y la reutilización de componentes.',
      tecnologias: ['Angular', 'TypeScript', 'SCSS', 'APIs REST', 'Docker'],
      estado: 'Proyecto empresarial bajo acuerdo de confidencialidad (NDA).'
    },
    {
      titulo: 'Portal de Atención y Servicios Digitales',
      descripcion: 'Desarrollo de una plataforma web para centralizar procesos de atención al usuario mediante formularios inteligentes, seguimiento de solicitudes y gestión de estados. Se trabajó en la experiencia responsive para dispositivos móviles, tabletas y escritorio.',
      tecnologias: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'Nginx'],
      estado: 'Proyecto empresarial bajo acuerdo de confidencialidad (NDA).'
    },
  ];
}
