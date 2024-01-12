import { Component, ViewChild } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
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
    private activatedRoute: ActivatedRoute
  ){}

  licenses$: Observable<License[]> = this.licenseService.geteEnterpriseLicenses$()
  @ViewChild('licenseMenu') licenseMenu: MatMenu;
  @ViewChild('trigger') menuTrigger: MatMenuTrigger;

  @ViewChild(LicenseStudentListComponent) licenseStudentList: LicenseStudentListComponent;

  selectedUsersIds: string[] = [];

  currentStatus: string = 'active'; // Valor predeterminado
  queryParamsSubscription: Subscription;

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatus = params['status'];
      }
    });
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

  removeLicense() {
    this.licenseStudentList.emitSelectedUsers(); // method in child component to store users in this.selectedUsers
    console.log("Remover")
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }
}
