import { Component } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-users-rhythm',
  templateUrl: './users-rhythm.component.html',
  styleUrls: ['./users-rhythm.component.css']
})
export class UsersRhythmComponent {

  constructor(
    public icon: IconService,

  ){}
  high: number = 5
  medium: number = 4
  low: number = 3
  noPlan: number = 10
}
