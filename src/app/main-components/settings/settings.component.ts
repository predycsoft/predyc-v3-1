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

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatus = params['status'];
      }
    });

    this.licensesSubscription = this.licenses$.subscribe(licenses => {
      if (licenses && licenses.length > 0) {
        this.licenses = licenses;
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
