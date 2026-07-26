import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {


  about = `Soy desarrollador de software Full Stack con formación en análisis, diseño y desarrollo de soluciones tecnológicas. Tengo experiencia en la creación de aplicaciones web, integración de servicios, diseño de interfaces y gestión de bases de datos, siempre enfocado en ofrecer productos funcionales, seguros y mantenibles.

  Mi enfoque combina la lógica del desarrollo backend con la creación de experiencias de usuario claras y atractivas en el frontend. Me interesa construir software de calidad aplicando principios de arquitectura, buenas prácticas de programación y metodologías de trabajo colaborativas.

  Me considero una persona analítica, autodidacta y orientada a resultados, con una fuerte motivación por aprender nuevas tecnologías y enfrentar retos que contribuyan a mi crecimiento profesional como ingeniero de software.`;

  tecnologias = [
    {
      titulo: 'Angular',
      imagen: 'assets/icons/angular.png'
    },
    {
      titulo: 'Typescript',
      imagen: 'assets/icons/typescript.png'
    },
    {
      titulo: 'MongoDb',
      imagen: 'assets/icons/mongo.png'
    },
    {
      titulo: 'React',
      imagen: 'assets/icons/react.png'
    },
    {
      titulo: 'Css',
      imagen: 'assets/icons/css.png'
    },
    {
      titulo: 'Docker',
      imagen: 'assets/icons/docker.png'
    },
    {
      titulo: 'Html',
      imagen: 'assets/icons/html.png'
    },
    {
      titulo: 'Ionic',
      imagen: 'assets/icons/ionic.png'
    },
    {
      titulo: 'Javascript',
      imagen: 'assets/icons/javascript.png'
    },
    {
      titulo: 'Mysql',
      imagen: 'assets/icons/mysql.png'
    },
    {
      titulo: 'Java',
      imagen: 'assets/icons/java.png'
    },
    {
      titulo: '.Net core',
      imagen: 'assets/icons/puntonet.png'
    },
    {
      titulo: 'Python',
      imagen: 'assets/icons/python.png'
    },
    {
      titulo: 'Scss',
      imagen: 'assets/icons/scss.png'
    },
    {
      titulo: 'Github',
      imagen: 'assets/icons/github.png'
    },
  ]
}
