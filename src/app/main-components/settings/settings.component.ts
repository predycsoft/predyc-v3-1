import { Component, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { Observable, Subscription } from 'rxjs';
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
  ){}

  licenses$: Observable<License[]> = this.licenseService.geteEnterpriseLicenses$()
  @ViewChild('licenseMenu') licenseMenu: MatMenu;
  @ViewChild(LicenseStudentListComponent) licenseStudentList: LicenseStudentListComponent;

  selectedUsersIds: string[] = [];

  ngOnInit() {
  }

  handleSelectedUsers(users: any[]) {
    const usersIds = users.map(user => {
      return user.uid
    })
    this.selectedUsersIds = usersIds;
  }

  async selectLicense(license: License) {
    this.licenseStudentList.emitSelectedUsers(); // method in child component to store users in this.selectedUsers
    console.log("this.selectedUsers", this.selectedUsersIds)
    await this.licenseService.assignLicense(license, this.selectedUsersIds);
  }
}
