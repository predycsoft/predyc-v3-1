import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IconService } from 'src/shared/services/icon.service';
import { Permissions } from 'src/shared/models/permissions.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { PermissionsAdvancedFiltersComponent } from './permissions-advanced-filters/permissions-advanced-filters.component';




@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    public icon: IconService,
  ){}

  @ViewChild(PermissionsAdvancedFiltersComponent) childComponent: PermissionsAdvancedFiltersComponent;

  generalPermissionsData

  hasGeneralFormChanged = false
  hasAdvancedFormChanged = false //Valor proveniente del formulario de abajo

  changedFieldName: string;
  changedFieldValue: any;

  showLibertyTooltip = false
  showGenerationTooltip = false
  libertyOptions = Permissions.STUDY_LIBERTY_OPTIONS;
  generationOptions = Permissions.STUDYPLAN_GENERATION_OPTIONS;
  form: FormGroup

  ngOnInit() {
    this.initializeForm();
    this.subscribeToFormChanges()
  }

  initializeForm() {
    this.form = new FormGroup({
      "hoursPerWeek": new FormControl(null),
      "studyLiberty": new FormControl(null),
      "studyplanGeneration": new FormControl(null),
      "attemptsPerTest": new FormControl(null),
    });

    this.generalPermissionsData = this.enterpriseService.getEnterprise().permissions
    // console.log("generalPermissionsData", generalPermissionsData)
    this.form.patchValue(this.generalPermissionsData);
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

  onAdvancedFormChange(hasAdvancedFormChanged: boolean) {
    this.hasAdvancedFormChanged = hasAdvancedFormChanged
    Object.keys(this.form.controls).forEach(field => {
      const control = this.form.get(field);
      if (control) {
        if (hasAdvancedFormChanged) {
          control.disable();
        } else {
          control.enable();
        }
      } else console.log('No existe el control.')
    });

  }


  async onSave() {
    this.hasGeneralFormChanged = false
    let newProfilePermissions = {...this.generalPermissionsData} as Permissions
    newProfilePermissions.attemptsPerTest = this.form.get('attemptsPerTest').value
    newProfilePermissions.studyplanGeneration = this.form.get('studyplanGeneration').value
    newProfilePermissions.hoursPerWeek = this.form.get('hoursPerWeek').value
    newProfilePermissions.studyLiberty = this.form.get('studyLiberty').value
    // Comparamos valores viejos con los nuevos
    if (JSON.stringify(this.generalPermissionsData) != JSON.stringify(newProfilePermissions)) {
      let newEnterprise = this.enterpriseService.getEnterprise()
      newEnterprise.permissions = newProfilePermissions
      await this.enterpriseService.editEnterprise(newEnterprise)
      // Guardamos datos del formulario de permisos avanzados
      this.childComponent.onSave();
    }
  }

}
