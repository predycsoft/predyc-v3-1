import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IconService } from 'src/app/shared/services/icon.service';

export interface ModelJson  {
  hours: number | null
  liberty: "strict" |"optimum" |"standard" |"average" | null
  generation: "strict" |"optimum" |"standard" |"average" | null
  attempts: number | null
}

export class Model {  
  hours: number | null
  liberty: "strict" |"optimum" |"standard" |"average" | null
  generation: "strict" |"optimum" |"standard" |"average" | null
  attempts: number | null

  public static OPTION_STRICT: string = 'strict'
  public static OPTION_OPTIMUM: string = 'optimum'
  public static OPTION_STANDARD: string = 'standard'
  public static OPTION_AVERAGE: string = 'average'

  public static OPTIONS_TO_DISPLAY = ["Estricto", "Óptimo", "Estándar", "Promedio"]
  public static OPTIONS = [this.OPTION_STRICT, this.OPTION_OPTIMUM, this.OPTION_STANDARD, this.OPTION_AVERAGE]


  public static mapOptions(option: typeof Model.OPTION_STRICT | typeof Model.OPTION_OPTIMUM | typeof Model.OPTION_STANDARD | typeof Model.OPTION_AVERAGE): string {
    const index = this.OPTIONS.indexOf(option);
    if (index > -1) {
      return this.OPTIONS_TO_DISPLAY[index];
    }
    return option;  // retorna el valor original si no hay equivalencia
  }
}

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  constructor(
    public icon: IconService,
  ){}

  optionsToDisplay = Model.OPTIONS_TO_DISPLAY
  modelOptions = Model.OPTIONS
  form: FormGroup

  // From firebase
  values: Model = {
    hours : 9,
    liberty : "strict",
    generation : "average",
    attempts : 2,
  }

  defaultFormValues: Model = {
    hours : 6,
    liberty : "strict",
    generation : "optimum",
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

    this.form.valueChanges.subscribe(value => {
      console.log('Formulario actualizado:', value);
      // Colocar logica aqui para actualizar datos en firebase si queremos hacerlo cada vez que cambie un valor
    });

    console.log("this.form.value", this.form.value)
  }

  mapOptions(option: typeof Model.OPTION_STRICT | typeof Model.OPTION_OPTIMUM | typeof Model.OPTION_STANDARD | typeof Model.OPTION_AVERAGE): string {
    return Model.mapOptions(option)
  }

}
