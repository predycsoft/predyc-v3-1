import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent {
  constructor(
    public icon: IconService,
  ){}
}
