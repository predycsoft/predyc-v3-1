import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { License } from 'src/shared/models/license.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';
import { LicenseService } from 'src/shared/services/license.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogNewLicenseComponent } from './dialog-new-license/dialog-new-license.component';
import { DialogService } from 'src/shared/services/dialog.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon } from 'src/shared/models/coupon.model';
import { Price } from 'src/shared/models/price.model';
import { Product } from 'src/shared/models/product.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';

@Component({
  selector: 'app-enterprise-students',
  templateUrl: './enterprise-students.component.html',
  styleUrls: ['./enterprise-students.component.css']
})
export class EnterpriseStudentsComponent {

  @Input() enterprise: Enterprise
  enterpriseRef: DocumentReference<Enterprise>
  constructor(
    public icon: IconService,
    public dialogService: DialogService,
    private entepriseService: EnterpriseService,
  ){}




  ngOnInit() {
    this.enterpriseRef = this.entepriseService.getEnterpriseRefById(this.enterprise.id)

  }


  ngAfterViewInit() {
  }


  async onSelect() {

  }





  addAdmins() {

  }

  addUser(){

  }

}
