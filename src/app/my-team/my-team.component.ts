import { Component } from '@angular/core';
import { IconService } from '../services/icon.service';

@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css']
})
export class MyTeamComponent {
  constructor(
    public icon: IconService,
  ){}
}