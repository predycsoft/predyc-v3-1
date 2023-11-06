import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IconService } from 'src/app/shared/services/icon.service';
import { Permissions } from 'src/app/shared/models/permissions.model';




@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  constructor(
    public icon: IconService,
  ){}

  changedFieldName: string;
  changedFieldValue: any;

  showLibertyTooltip = false
  showGenerationTooltip = false
  libertyOptions = Permissions.STUDY_LIBERTY_OPTIONS;
  generationOptions = Permissions.STUDYPLAN_GENERATION_OPTIONS;
  form: FormGroup

  // From firebase
  values: Permissions = {
    hoursPerWeek : 1,
    studyLiberty :"Solicitudes",
    studyplanGeneration : null,
    attemptsPerTest : 2,
  }

  // Actualización de valores por defecto
  defaultFormValues: Permissions = {
    hoursPerWeek: 4,
    studyLiberty: Permissions.STUDY_LIBERTY_STRICT_OPTION,
    studyplanGeneration: Permissions.STUDYPLAN_GENERATION_OPTIMIZED_OPTION,
    attemptsPerTest: 3
  };

  ngOnInit() {
    this.initializeForm();
    this.subscribeToFormChanges()
  }

  initializeForm() {
    this.form = new FormGroup({
      "hoursPerWeek": new FormControl(this.defaultFormValues.hoursPerWeek),
      "studyLiberty": new FormControl(this.defaultFormValues.studyLiberty),
      "studyplanGeneration": new FormControl(this.defaultFormValues.studyplanGeneration),
      "attemptsPerTest": new FormControl(this.defaultFormValues.attemptsPerTest),
    });

    if (this.values) {
      const nonNullValues = Object.keys(this.values).reduce((acc, key) => {
        if (this.values[key] !== null) {
          acc[key] = this.values[key];
        }
        return acc;
      }, {});
      this.form.patchValue(nonNullValues);
    }
    console.log("this.form.value", this.form.value)
  }

  subscribeToFormChanges() {
    // Suscribirse a los cambios de cada control individualmente
    Object.keys(this.form.controls).forEach(field => { 
      const control = this.form.get(field);
      control.valueChanges.subscribe(value => {
        // console.log(`El campo ${field} cambió a:`, value);
        this.changedFieldName = field;
        this.changedFieldValue = value;
      });
    });
  }

  mapNumberOptions(option: number, field: "hoursPerWeek" | "attemptsPerTest"): string {
    return Permissions.mapNumberOptions(option, field)
  }

  getBlockClass(value: string | number, position: number, field: string): string {
    const styles = {
      hoursPerWeek: {
        1: ['red', 'red-op', 'red-op2'],
        2: ['red', 'red-op', 'red-op2'],
        3: ['red', 'red-op', 'red-op2'],
        4: ['yellow', 'yellow', 'yellow-op'],
        5: ['yellow', 'yellow', 'yellow-op'],
        6: ['green', 'green', 'green'],
        7: ['green', 'green', 'green'],
        8: ['green', 'green', 'green'],
      },
      studyLiberty: {
        Libre: ['green', 'green', 'green'],
        Estricto: ['yellow', 'yellow', 'yellow-op'],
        Solicitudes: ['red', 'red-op', 'red-op2']
      },
      studyplanGeneration: {
        Optimizada: ['green', 'green', 'green'],
        Confirmar: ['yellow', 'yellow', 'yellow-op'],
        'Por defecto': ['red', 'red-op', 'red-op2']
      },
      attemptsPerTest: {
        1: ['red', 'red-op', 'red-op2'],
        2: ['yellow', 'yellow', 'yellow-op'],
        3: ['green', 'green', 'green'],
        4: ['green', 'green', 'green'],
        5: ['green', 'green', 'green'],
      }
    };

    return styles[field] && styles[field][value] ? styles[field][value][position - 1] : '';
  }

}
