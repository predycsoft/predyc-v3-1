import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Profile } from 'src/app/shared/models/profile.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {

  // ***************************************   
  
  // constructor(
  //   private enterpriseService: EnterpriseService,
  // ) {}
  // enterpriseLoaded = false
  // ngOnInit() {
  //   this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseLoaded => {
  //     if (enterpriseLoaded) this.enterpriseLoaded = true
  //   })
  // }

  // ***************************************   


  constructor(
    public icon: IconService,
  ){}
  ngOnInit() {
  }
}
