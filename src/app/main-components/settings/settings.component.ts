import { Component, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { Observable, Subscription } from 'rxjs';
import { License } from 'src/app/shared/models/license.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LicenseService } from 'src/app/shared/services/license.service';
import { ProfileService } from 'src/app/shared/services/profile.service';

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


  ngOnInit() {
    this.licenses$.subscribe(licenses => console.log('licenses', licenses))
  }

  async selectLicence(license: License) {
    let user: any = '' // Remove any from user
    await this.licenseService.assignLicense(license, user)
  }
}
