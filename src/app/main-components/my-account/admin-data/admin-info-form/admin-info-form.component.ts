import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-admin-info-form',
  templateUrl: './admin-info-form.component.html',
  styleUrls: ['./admin-info-form.component.css']
})
export class AdminInfoFormComponent {

  constructor(
    public icon:IconService,
    private userService: UserService,

  ) {}

  @Output() onAdminInfoChange: EventEmitter<any> = new EventEmitter<any>()


  adminUser: User

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    firstName: "Nombres",
    email: "Email desconocido",
    job: "Cargo desconocido",
    secondName: "Apellidos",
    phoneNumber: "Teléfono desconocido",
    country: "País desconocido",
    city: "Ciudad desconocida",
    zipCode: "Código postal desconocido",
  }

  async ngOnInit(){

    this.userService.getUsersObservable().subscribe(users => {
      if(users.length > 0) {
        const adminUsers = users.filter(x => x.role === "admin")
        this.adminUser = adminUsers.length > 0? adminUsers[0]: null
        this.initForm()
      }
    })

  }

  initForm() {


    // Aqui podemos definir firstName y secondName a partir del name del adminUser
    // let firstName = ""
    // let secondName = ""
    //
    
    this.form =  new FormGroup({
      "firstName": new FormControl(null),
      "email": new FormControl(null),
      "job": new FormControl(null),
      "secondName": new FormControl(null),
      "phoneNumber": new FormControl(null),
      "country": new FormControl(null),
      "city": new FormControl(null),
      "zipCode": new FormControl(null),
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
