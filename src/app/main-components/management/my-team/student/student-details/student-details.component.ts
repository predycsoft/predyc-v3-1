import { Component } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent {
  constructor(
    public icon: IconService,
  ){}
}
