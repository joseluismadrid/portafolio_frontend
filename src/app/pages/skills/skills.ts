import { Component } from '@angular/core';

@Component({
  selector: 'app-skills',
  imports: [],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  habilidades = [
    {
      titulo: 'Frontend',
      items: [
        'Desarrollo de interfaces responsivas',
        'Componentes reutilizables',
        'Diseño adaptativo',
        'Consumo de APIs REST'
      ]
    },
    {
      titulo: 'Backend',
      items: [
        'Diseño de APIs REST',
        'Arquitectura por capas',
        'Autenticación y autorización',
        'Integración de bases de datos'
      ]
    },
    {
      titulo: 'Bases de Datos',
      items: [
        'Modelado de datos',
        'Consultas SQL',
        'Optimización de consultas',
        'MongoDB y MySQL'
      ]
    },
    {
      titulo: 'Profesionales',
      items: [
        'Resolución de problemas',
        'Pensamiento analítico',
        'Trabajo en equipo',
        'Aprendizaje continuo'
      ]
    }
  ];
}
