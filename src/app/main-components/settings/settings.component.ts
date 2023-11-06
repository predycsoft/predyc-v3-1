import { Component } from '@angular/core';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {

  constructor(
    private enterpriseService: EnterpriseService,
  ) {}

  enterpriseLoaded = false
  
  ngOnInit() {
    this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseLoaded => {
      if (enterpriseLoaded) this.enterpriseLoaded = true
    })
  }
}
