import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { License } from 'src/shared/models/license.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';
import { LicenseService } from 'src/shared/services/license.service';
import { Subscription as SubscriptionClass } from 'src/shared/models/subscription.model'
import { MatDialog } from '@angular/material/dialog';
import { DialogNewLicenseComponent } from './dialog-new-license/dialog-new-license.component';


interface LicensesInList {
  product: string,
  acquired: number,
  used: number,
  avaliable: number,
  valid: number,
  status: string,
}

@Component({
  selector: 'app-enterprise-students',
  templateUrl: './enterprise-students.component.html',
  styleUrls: ['./enterprise-students.component.css']
})
export class EnterpriseStudentsComponent {

  @Input() enterprise: Enterprise

  constructor(
    private licenseService: LicenseService,
    private enteprriseService: EnterpriseService,
    public icon: IconService,
    private dialog: MatDialog,


  ){}

  displayedColumns: string[] = [
    "product",
    "rotations",
    "avaliable",
    "inUse",
    "expiration",
    "status",
    
  ];

  dataSource = new MatTableDataSource<LicensesInList>();

  licenseSubscription: Subscription

  ngOnInit() {
    const enterpriseRef = this.enteprriseService.getEnterpriseRefById(this.enterprise.id)
    this.licenseSubscription = this.licenseService.getLicensesByEnterpriseRef$(enterpriseRef).subscribe(licenses => {
      console.log("licenses", licenses)

      const licensesInList: LicensesInList[] = licenses.map(license => {
        return {
          product: "Plan Predyc Empresa", //Check this
          acquired: license.quantity,
          used: license.quantityUsed,
          avaliable: license.quantity - license.quantityUsed,
          valid: license.currentPeriodEnd,
          status: SubscriptionClass.statusToDisplayValueDict[license.status]
        }
      })
      this.dataSource.data = licensesInList
    })

  }


  ngAfterViewInit() {
  }


  async onSelect() {

  }


  ngOnDestroy() {
    if (this.licenseSubscription) this.licenseSubscription.unsubscribe()
  }



  addAdmins() {

  }

  addLicense() {
    this.dialog.open(DialogNewLicenseComponent).afterClosed().subscribe((result: License) => {
      if(result){
        result.enterpriseRef = this.enteprriseService.getEnterpriseRefById(this.enterprise.id)
        console.log("result del dialog", result)
      }
    })
  }

  addUser(){

  }

}
