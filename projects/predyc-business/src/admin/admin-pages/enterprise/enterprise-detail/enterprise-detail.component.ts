import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';

@Component({
  selector: 'app-enterprise-detail',
  templateUrl: './enterprise-detail.component.html',
  styleUrls: ['./enterprise-detail.component.css']
})
export class EnterpriseDetailComponent {

  enterpriseId = this.route.snapshot.paramMap.get('id');
  enterprise: Enterprise
  tab: number = 0
  firstLoad = false

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private enterpriseService: EnterpriseService
  ) {}


  ngOnInit() {

    if (this.enterpriseId) {
      this.enterpriseService.getEnterpriseById$(this.enterpriseId).subscribe(enterprise => {
        // console.log("enterprise", enterprise)
        this.enterprise = enterprise
        this.firstLoad = true //check this
      })
    }
    else this.firstLoad = true
  }


}
