import { Component } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-users-study-time-container',
  templateUrl: './users-study-time-container.component.html',
  styleUrls: ['./users-study-time-container.component.css']
})
export class UsersStudyTimeContainerComponent {

  constructor(
    public icon: IconService,

  ){}
  
  chartTab: number = 0
  timeWeek: number = 0
  timeMonth: number = 0
}
