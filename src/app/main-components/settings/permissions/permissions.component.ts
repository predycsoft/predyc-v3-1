import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IconService } from 'src/app/shared/services/icon.service';

export interface ModelJson  {
  hours: number | null
  liberty: "free" |"strict" |"request" | null
  generation: "optimum" |"confirm" |"default" | null
  attempts: number | null
}

export class Model {  
  hours: number | null
  liberty: "free" |"strict" |"request" | null
  generation: "optimum" |"confirm" |"default" | null
  attempts: number | null

  public static OPTION_FREE: string = 'free'
  public static OPTION_STRICT: string = 'strict'
  public static OPTION_REQUEST: string = 'request'
  public static OPTION_OPTIMUM: string = 'optimum'
  public static OPTION_CONFIRM: string = 'confirm'
  public static OPTION_DEFAULT: string = 'default'

  public static LIBERTY_OPTIONS_TO_DISPLAY = ["Libre", "Estricto", "Solicitudes"]
  public static GENERATION_OPTIONS_TO_DISPLAY = ["Óptimo", "Confirmar", "Por defecto"]
  public static LIBERTY_OPTIONS = [this.OPTION_FREE, this.OPTION_STRICT, this.OPTION_REQUEST]
  public static GENERATION_OPTIONS = [this.OPTION_OPTIMUM, this.OPTION_CONFIRM, this.OPTION_DEFAULT]


  public static mapOptions(option: 
    typeof Model.OPTION_FREE | 
    typeof Model.OPTION_STRICT | 
    typeof Model.OPTION_REQUEST | 
    typeof Model.OPTION_OPTIMUM | 
    typeof Model.OPTION_CONFIRM | 
    typeof Model.OPTION_DEFAULT
  ): string {
    let index: number
    if (option === Model.OPTION_FREE || option === Model.OPTION_STRICT || option === Model.OPTION_REQUEST ) {
      index = this.LIBERTY_OPTIONS.indexOf(option);
      if (index > -1) {
        return this.LIBERTY_OPTIONS_TO_DISPLAY[index];
      }
    } else {
      index = this.GENERATION_OPTIONS.indexOf(option);
      if (index > -1) {
        return this.GENERATION_OPTIONS_TO_DISPLAY[index];
      }
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
  showLibertyTooltip = false
  showGenerationTooltip = false
  libertyOptionsToDisplay = Model.LIBERTY_OPTIONS_TO_DISPLAY
  GenerationOptionsToDisplay = Model.GENERATION_OPTIONS_TO_DISPLAY
  libertyOptions = Model.LIBERTY_OPTIONS
  generationOptions = Model.GENERATION_OPTIONS
  form: FormGroup

  // From firebase
  values: Model = {
    hours : 9,
    liberty : "request",
    generation : "confirm",
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

  mapOptions(option: 
    typeof Model.OPTION_FREE | 
    typeof Model.OPTION_STRICT | 
    typeof Model.OPTION_REQUEST | 
    typeof Model.OPTION_OPTIMUM | 
    typeof Model.OPTION_CONFIRM | 
    typeof Model.OPTION_DEFAULT
  ): string {
    return Model.mapOptions(option)
  }

}
