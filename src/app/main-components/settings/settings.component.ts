import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { DialogRequestLicensesComponent } from 'src/app/shared/components/users/license-student-list/dialog-request-licenses/dialog-request-licenses.component';
import { DialogHistoryLicensesComponent } from 'src/app/shared/components/users/license-student-list/dialog-history-licenses/dialog-history-licenses.component';

import { LicenseStudentListComponent } from 'src/app/shared/components/users/license-student-list/license-student-list.component';
import { License } from 'src/app/shared/models/license.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { LicenseService } from 'src/app/shared/services/license.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  
  constructor(
    public icon: IconService,
    public licenseService: LicenseService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,

  ){}

  licenses$: Observable<License[]> = this.licenseService.geteEnterpriseLicenses$()
  licenses: License[];
  licensesSubscription: Subscription;

  @ViewChild('licenseMenu') licenseMenu: MatMenu;
  @ViewChild('trigger') menuTrigger: MatMenuTrigger;

  selectedUsersIds: string[] = [];
  selectedLicense: License;

  currentStatus: string = 'active';
  queryParamsSubscription: Subscription;

  hasLicenseChanged = 1 //flag to deselect checkboxes after license assign or removed

  today = +new Date()

  totalLicenses: number
  availableLicenses: number
  availableRotations: number
  expirationDate: number

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatus = params['status'];
      }
    });

    this.licensesSubscription = this.licenses$.subscribe(licenses => {
      if (licenses && licenses.length > 0) {
        this.licenses = licenses;
        let totalLicenses = 0
        let availableLicenses = 0
        let availableRotations = 0
        let expirationDate = null
        licenses.forEach(license => {
          if (license.status !== 'active') return
          totalLicenses += license.quantity
          availableLicenses += license.quantity - license.quantityUsed
          availableRotations += license.rotations
          if (!expirationDate || expirationDate < license.currentPeriodEnd) expirationDate = license.currentPeriodEnd
        })
        this.totalLicenses = totalLicenses
        this.availableLicenses = availableLicenses
        this.availableRotations = availableRotations
        this.expirationDate = expirationDate
        if (!this.selectedLicense) this.selectedLicense = licenses[0]
        else {
          // update selectedLicense values
          this.selectedLicense = licenses.find(license => license.id === this.selectedLicense.id)
        }
      }
    });
  }

  handleSelectedUsers(users: any[]) {
    this.selectedUsersIds = users;
  }

  async selectLicense(license: License) {
    try {      
      await this.licenseService.assignLicense(license, this.selectedUsersIds);
      this.hasLicenseChanged = -this.hasLicenseChanged
    } 
    catch(error) {
      console.error("Operación cancelada o falló", error);
    }
  }

  async removeLicense() {
    try {
      await this.licenseService.removeLicense(this.selectedUsersIds)
      this.hasLicenseChanged = -this.hasLicenseChanged
    } 
    catch (error) {
      console.error("Operación cancelada o falló", error);
    }
  }

  assignLicense(){
    let today = new Date().getTime()
    let licencia = this.licenses.filter(license=>license.quantity>license.quantityUsed && license.status == 'active' && (license.currentPeriodEnd>=today) ).sort((a, b) => a.currentPeriodStart - b.currentPeriodStart)
    let LicenciaUsar;
    if (licencia.length>0){
      LicenciaUsar = licencia[0]
      console.log('LicenciaUsar',LicenciaUsar)
      this.selectLicense(LicenciaUsar)
    }
    else{
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "No hay licencias disponibles",
      });
    }
  }

  showDialog(licenses: License[]) {
    this.dialog.open(DialogRequestLicensesComponent, {
      data: {
        licenses
      }
    })
  }
  showDialog2(licenses: License[]) {
    this.dialog.open(DialogHistoryLicensesComponent, {
      data: {
        licenses
      }
    })
  }


  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
      this.licensesSubscription.unsubscribe()
    }
  }
}
