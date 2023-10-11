import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  constructor(
    public icon: IconService,
  ){}

  options = ["Estricto", "Óptimo", "Estándar", "Promedio"]
  form: FormGroup

  values = {
    hours : 9,
    liberty : "Estándar",
    generation : "Promedio",
    attempts : 2,
  }

  defaultFormValues = {
    hours : 6,
    liberty : "Estricto",
    generation : "Óptimo",
    attempts : 3,
  }

  ngOnInit() {
    this.form =  new FormGroup({
      "hours": new FormControl(null),
      "liberty": new FormControl(""),
      "generation": new FormControl(""),
      "attempts": new FormControl(null),
    })

    if (this.values){
      this.form.patchValue(this.values)
      
    }
    else {
      this.form.patchValue(this.defaultFormValues)
    }

    console.log("this.form.value", this.form.value)
  }


}
