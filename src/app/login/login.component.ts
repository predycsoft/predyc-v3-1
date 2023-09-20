import { Component } from '@angular/core';
import { IconService } from '../shared/services/icon.service';
import { AuthService } from '../shared/services/auth.service';
import { AlertsService } from '../shared/services/alerts.service';
import { firstValueFrom } from 'rxjs';
import { User } from '../shared/models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  form: FormGroup;

  constructor(
    private authService: AuthService,
    public icon: IconService,
    private swal: AlertsService,
    private afs: AngularFirestore,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.login(this.form.value.email, this.form.value.password)
    }
  }

  async login(email: string, password: string) {
    try {
      const adminUsers = await firstValueFrom(this.afs.collection<User>(User.collection, ref => 
      ref.where('email', '==', email)
         .where('role', '==', User.ROLE_ADMIN)
      ).valueChanges())
      if (adminUsers.length === 0) { 
        throw Error(`El correo ${email} no existe o no tiene permiso para acceder a la herramienta`)
      }
      await this.authService.signIn(email, password)
      // Handle successful login, navigate or update UI
    } catch (error) {
      // Handle login error
      console.log(error);
      this.swal.errorAlert(error as string)
    }
  }

}
