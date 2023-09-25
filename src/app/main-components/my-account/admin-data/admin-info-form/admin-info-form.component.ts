import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-admin-info-form',
  templateUrl: './admin-info-form.component.html',
  styleUrls: ['./admin-info-form.component.css']
})
export class AdminInfoFormComponent {

  constructor(
    private authService: AuthService,
    public icon:IconService,
    private alertService: AlertsService,
    private userService: UserService,

  ) {}

  @Output() onAdminInfoChange: EventEmitter<any> = new EventEmitter<any>()


  user: User
  adminUser: User

  isEditing = false

  form: FormGroup

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      this.user = user
      
    })

    this.userService.getUsersObservable().subscribe(users => {
      if(users.length > 0) {
        const adminUsers = users.filter(x => x.role === "admin")
        this.adminUser = adminUsers.length > 0? adminUsers[0]: null
        console.log("this.adminUser")
        console.log(this.adminUser)
        this.initForm()
      }
    })

  }

  initForm() {
    let firstName = "Carlos"
    let email = "Email desconocido"
    let job = "Cargo desconocido"
    let secondName = "Martínez Encinas"
    let phoneNumber = "Teléfono desconocido"
    let country = "País desconocido"
    let city = "Ciudad desconocida"
    let zipCode = "Código postal desconocido"

    // Aqui podemos definir firstName y secondName a partir del name del adminUser

    //
    
    this.form =  new FormGroup({
      "firstName": new FormControl(firstName),
      "email": new FormControl(email),
      "job": new FormControl(job),
      "secondName": new FormControl(secondName),
      "phoneNumber": new FormControl(phoneNumber),
      "country": new FormControl(country),
      "city": new FormControl(city),
      "zipCode": new FormControl(zipCode),
    })

    if (this.adminUser) {
      this.form.patchValue(this.adminUser)
    }

  }
  
  onClick() {
    if (this.isEditing) {
      this.onSubmit();
    }
    this.isEditing = !this.isEditing;
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      this.onAdminInfoChange.emit(this.form.value)
    }
    else {
      Object.keys(controls).forEach(prop => {
        if (!controls[prop].valid && !controls[prop].disabled ) {
          if (controls[prop].touched) {
            console.log(`El valor de "${prop}" es invalido`)
          }
          else {
            console.log(`Debes llenar el campo "${prop}"`)
          }
        }
      });
    }
  }

}
