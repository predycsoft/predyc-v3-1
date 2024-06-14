import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-enterprise-detail',
  templateUrl: './enterprise-detail.component.html',
  styleUrls: ['./enterprise-detail.component.css']
})
export class EnterpriseDetailComponent {

  enterpriseId = this.route.snapshot.paramMap.get('id');
  enterprise: Enterprise
  tab: number = 1
  firstLoad = false

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private enterpriseService: EnterpriseService,
    private fireFunctions: AngularFireFunctions,

  ) {}


  ngOnInit() {

    if (this.enterpriseId) {
      this.enterpriseService.getEnterpriseById$(this.enterpriseId).subscribe(enterprise => {
        // console.log("enterprise", enterprise)
        this.enterprise = enterprise
        this.firstLoad = true //check this
      })
    }
    else{
      this.firstLoad = true
      this.tab = 0
    } 
  }

  async procesarDatosEmpresa(){


    await firstValueFrom(
      this.fireFunctions.httpsCallable("updateDataEnterpriseUsage")({
        enterpriseId: this.enterpriseId as string,
      })
    );


    await firstValueFrom(
      this.fireFunctions.httpsCallable("updateDataEnterpriseRhythm")({
        enterpriseId: this.enterpriseId as string,
      })
    );




  }


}
