import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[attr.aria-label]': 'label',
  },
})
export class Loader {
  @Input() label = 'Cargando';
}
