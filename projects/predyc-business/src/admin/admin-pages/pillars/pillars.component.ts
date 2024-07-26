import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-pillars',
  templateUrl: './pillars.component.html',
  styleUrls: ['./pillars.component.css']
})
export class PillarsComponent {
  constructor(
    public icon: IconService,
  ){}
}
