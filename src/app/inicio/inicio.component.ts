import { Component } from '@angular/core';
import { IconService } from '../services/icon.service';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {


  constructor(public icon: IconService) {

  }


  email = "";
  password = "";
  loading = false;

}
