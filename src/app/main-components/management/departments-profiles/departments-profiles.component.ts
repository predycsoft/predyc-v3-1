import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';

@Component({
  selector: 'app-departments-profiles',
  templateUrl: './departments-profiles.component.html',
  styleUrls: ['./departments-profiles.component.css']
})
export class DepartmentsProfilesComponent {
  constructor(
    public icon: IconService,
  ){}
}
