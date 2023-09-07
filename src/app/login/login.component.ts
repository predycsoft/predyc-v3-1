import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from '../shared/services/icon.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {


  constructor(
    public icon: IconService,
    private router: Router
  ) {

  }


  email = "";
  password = "";
  loading = false;

  ngOnInit() {
    this.router.navigate([''])
  }

}
