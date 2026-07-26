import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cards',
  standalone: true,
  templateUrl: './cards.html',
  styleUrl: './cards.scss',
})
export class Cards {

  @Input() titulo = '';
  @Input() descripcion? = '';
  @Input() imagen = '';

}
