import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSliderChange } from '@angular/material/slider';
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

  public static OPTION_BASIC: 'basic' = 'basic'
  public static OPTION_AVERAGE: 'average' = 'average'
  public static OPTION_STANDARD: 'standard' = 'standard'
  public static OPTION_FREE: 'free' = 'free'
  public static OPTION_STRICT: 'strict' = 'strict'
  public static OPTION_REQUEST: 'request' = 'request'
  public static OPTION_OPTIMUM: 'optimum' = 'optimum'
  public static OPTION_CONFIRM: 'confirm' = 'confirm'
  public static OPTION_DEFAULT: 'default' = 'default'

  public static LIBERTY_OPTIONS = [Model.OPTION_FREE, Model.OPTION_STRICT, Model.OPTION_REQUEST]
  public static GENERATION_OPTIONS = [Model.OPTION_OPTIMUM, Model.OPTION_CONFIRM, Model.OPTION_DEFAULT]


  private static OPTIONS_MAP = {
    [Model.OPTION_FREE]: "Libre",
    [Model.OPTION_STRICT]: "Estricto",
    [Model.OPTION_BASIC]: "Básico",
    [Model.OPTION_AVERAGE]: "Promedio",
    [Model.OPTION_STANDARD]: "Estándar",
    [Model.OPTION_REQUEST]: "Solicitudes",
    [Model.OPTION_OPTIMUM]: "Óptimo",
    [Model.OPTION_CONFIRM]: "Confirmar",
    [Model.OPTION_DEFAULT]: "Promedio",
  };
  
  public static mapStringOptions(option: string): string {
    return this.OPTIONS_MAP[option] || option;
  }

  public static mapNumberOptions(option: number, field: string): string {
    const hourBasicCase = [1, 2, 3]
    const hourStandardCase = [6, 7, 8]

    const attemptStrictCase = 1
    const attemptBasicCase = 2

    const hourValue = hourBasicCase.includes(option) ? Model.OPTION_BASIC : hourStandardCase.includes(option) ? Model.OPTION_STANDARD : Model.OPTION_AVERAGE
    const attemptValue = option === attemptStrictCase ? Model.OPTION_STRICT : option === attemptBasicCase ? Model.OPTION_BASIC : Model.OPTION_AVERAGE
    
    if (field === "hours") return this.mapStringOptions(hourValue)
    return this.mapStringOptions(attemptValue) 
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
  libertyOptions = Model.LIBERTY_OPTIONS
  generationOptions = Model.GENERATION_OPTIONS
  form: FormGroup

  // From firebase
  values: Model = {
    hours : null,
    liberty :"request",
    generation : null,
    attempts : 2,
  }

  defaultFormValues: Model = {
    hours : 4,
    liberty : "strict",
    generation : "optimum",
    attempts : 3,
  }

  ngOnInit() {
    this.form =  new FormGroup({
      "hours": new FormControl(this.defaultFormValues.hours),
      "liberty": new FormControl(this.defaultFormValues.liberty),
      "generation": new FormControl(this.defaultFormValues.generation),
      "attempts": new FormControl(this.defaultFormValues.attempts),
    })

    if (this.values){
      const nonNullValues = Object.keys(this.values).reduce((acc, key) => {
          if (this.values[key] !== null) {
              acc[key] = this.values[key];
          }
          return acc;
      }, {});
      this.form.patchValue(nonNullValues);
    }

    this.form.valueChanges.subscribe(value => {
      console.log('Formulario actualizado:', value);
      // Colocar logica aqui para actualizar datos en firebase si queremos hacerlo cada vez que cambie un valor
    });

    console.log("this.form.value", this.form.value)
  }

  mapStringOptions(option: 
    typeof Model.OPTION_FREE | 
    typeof Model.OPTION_STRICT | 
    typeof Model.OPTION_REQUEST | 
    typeof Model.OPTION_OPTIMUM | 
    typeof Model.OPTION_CONFIRM | 
    typeof Model.OPTION_DEFAULT
  ): string {
    return Model.mapStringOptions(option)
  }

  mapNumberOptions(option: number, field: "hours" | "attempts"): string {
    return Model.mapNumberOptions(option, field)
  }

  getBlockClass(value: string | number, position: number, field: string): string {
    const styles = {
      hours: {
        1: ['red', 'red-op', 'red-op2'],
        2: ['red', 'red-op', 'red-op2'],
        3: ['red', 'red-op', 'red-op2'],
        4: ['yellow', 'yellow', 'yellow-op'],
        5: ['yellow', 'yellow', 'yellow-op'],
        6: ['green', 'green', 'green'],
        7: ['green', 'green', 'green'],
        8: ['green', 'green', 'green'],
      },
      liberty: {
        free: ['green', 'green', 'green'],
        strict: ['yellow', 'yellow', 'yellow-op'],
        request: ['red', 'red-op', 'red-op2']
      },
      generation: {
        optimum: ['green', 'green', 'green'],
        confirm: ['yellow', 'yellow', 'yellow-op'],
        default: ['red', 'red-op', 'red-op2']
      },
      attempts: {
        1: ['red', 'red-op', 'red-op2'],
        2: ['yellow', 'yellow', 'yellow-op'],
        3: ['green', 'green', 'green'],
        4: ['green', 'green', 'green'],
        5: ['green', 'green', 'green'],
      }
    };

    return styles[field] && styles[field][value] ? styles[field][value][position - 1] : '';
  }


  // ----------------------
  displayedColumns: string[] = ['departamento', 'perfil', 'horas', 'libertad', 'generacion', 'intentos'];
  dataSource = [
    {departamento: 'Confiabilidad', perfil: 'Ingeniero de Confiabilidad', horas: '7:00', libertad: 'Libre', generacion: 'Optimizada', intentos: 5},
    {departamento: 'Planificación', perfil: 'Especialista en Programación de la Producción', horas: '8:00', libertad: 'Estricto', generacion: 'Confirmar', intentos: 3},
    {departamento: 'Mantenimiento', perfil: 'Técnico de Mantenimiento Eléctrico', horas: '4:00', libertad: 'Solicitudes', generacion: 'Por Defecto', intentos: 4}
  ];

  sliderValue: number = 1; // Valor inicial

  guardarValor(event) {
    console.log('Valor seleccionado:', event);
    // Aquí puedes hacer algo más con el valor si lo deseas
  }
}
