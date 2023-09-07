import { Component, Input } from '@angular/core';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-navigate-back',
  templateUrl: './navigate-back.component.html',
  styleUrls: ['./navigate-back.component.css']
})
export class NavigateBackComponent {
  @Input() targetUrl!: string

  constructor(public icon: IconService) {}
}
