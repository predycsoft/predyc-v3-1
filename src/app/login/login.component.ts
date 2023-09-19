import { Component } from '@angular/core';
import { IconService } from '../shared/services/icon.service';
import { AuthService } from '../shared/services/auth.service';
import { AlertsService } from '../shared/services/alerts.service';
import { firstValueFrom } from 'rxjs';
import { User } from '../shared/models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Notification } from '../shared/models/notification.model';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  // async migrate() {
  //   const users = await firstValueFrom(this.afs.collection<User>('users').valueChanges())
  //   for (let user of users) {
  //     this.afs.collection<User>(User.collection).doc(user.uid as string).set(user)
  //   }
  //   const collections = await firstValueFrom(this.afs.collection<Notification>('notifications').valueChanges())
  //   for (let collection of collections) {
  //     this.afs.collection<Notification>('notification').doc(collection.id as string).set(collection)
  //   }
  // }

  onSubmit() {
    console.log("this.form.valid")
    console.log(this.form.valid)
    if (this.form.valid) {
      this.login(this.form.value.email, this.form.value.password)
    }
  }

  async login(email: string, password: string) {
    try {
      const adminUsers = await firstValueFrom(this.afs.collection<User>(User.collection, ref => 
      ref.where('email', '==', email)
        .where('role', '==', 'admin')
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
