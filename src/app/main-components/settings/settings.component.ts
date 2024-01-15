import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { DialogRequestLicensesComponent } from 'src/app/shared/components/users/license-student-list/dialog-request-licenses/dialog-request-licenses.component';
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
  @ViewChild('licenseMenu') licenseMenu: MatMenu;
  @ViewChild('trigger') menuTrigger: MatMenuTrigger;

  @ViewChild(LicenseStudentListComponent) licenseStudentList: LicenseStudentListComponent;

  selectedUsersIds: string[] = [];

  currentStatus: string = 'active'; // Valor predeterminado
  queryParamsSubscription: Subscription;

  hasLicenseChanged = 1 //flag to deselect checkboxes after license assign or removed

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatus = params['status'];
      }
    });
  }

  handleSelectedUsers(users: any[]) {
    this.selectedUsersIds = users;
  }

  async selectLicense(license: License) {
    this.licenseStudentList.emitSelectedUsers(); // method in child component that pass selected users to handleSelectedUsers() method
    console.log("this.selectedUsers", this.selectedUsersIds)
    await this.licenseService.assignLicense(license, this.selectedUsersIds);
    this.hasLicenseChanged = -this.hasLicenseChanged
  }

  async removeLicense() {
    this.licenseStudentList.emitSelectedUsers(); // method in child component that pass selected users to handleSelectedUsers() method
    await this.licenseService.removeLicense(this.selectedUsersIds)
    this.hasLicenseChanged = -this.hasLicenseChanged
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  showDialog(licenses: License[]) {
    this.dialog.open(DialogRequestLicensesComponent, {
      data: {
        licenses
      }
    })
  }

  // test() {
  //   this.licenseStudentList.emitSelectedUsers(); // method in child component that pass selected users to handleSelectedUsers() method
  //   console.log("this.selectedUsers", this.selectedUsersIds)
  // }
}
