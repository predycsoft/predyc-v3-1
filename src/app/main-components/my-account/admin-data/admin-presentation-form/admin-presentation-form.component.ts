import { Component } from '@angular/core';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-admin-presentation-form',
  templateUrl: './admin-presentation-form.component.html',
  styleUrls: ['./admin-presentation-form.component.css']
})
export class AdminPresentationFormComponent {

  constructor(
    private authService: AuthService,
    public icon:IconService,
    private enterpriseService: EnterpriseService,

  ) {}

  user: User
  enterprise: Enterprise

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      this.user = user
      
    })

    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()
    

  }

}
