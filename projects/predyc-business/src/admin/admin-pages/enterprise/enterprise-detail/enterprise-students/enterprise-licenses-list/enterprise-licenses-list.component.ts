import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { License } from 'projects/shared/models/license.model';
import { Product } from 'projects/shared/models/product.model';
import { LicenseService } from 'projects/predyc-business/src/shared/services/license.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { DialogCreateLicenseComponent } from 'projects/predyc-business/src/shared/components/license/dialog-create-license/dialog-create-license.component';


interface LicensesInList {
  productName: string,
  acquired: number,
  used: number,
  avaliable: number,
  avaliableRotations: number
  start: number
  valid: number,
  status: string,
  rotations: number
  rotationsUsed: number

}

@Component({
  selector: 'app-enterprise-licenses-list',
  templateUrl: './enterprise-licenses-list.component.html',
  styleUrls: ['./enterprise-licenses-list.component.css']
})
export class EnterpriseLicensesListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private dialog: MatDialog,
    private licenseService: LicenseService,
    private productService: ProductService,
    public dialogService: DialogService,
  ) {}

  displayedColumns: string[] = [
    "product",
    "acquired",
    "rotations",
    "avaliable",
    "avaliableRotations",
    "inUse",
    "rotationsUsed",
  ];

  dataSource = new MatTableDataSource<LicensesInList>();

  products: Product[] = [];

  licenseSubscription: Subscription
  combinedServicesSubscription: Subscription


  ngOnInit() {
    this.combinedServicesSubscription = combineLatest(
      [
        this.productService.getProducts$(),
        this.licenseService.getLicensesByEnterpriseRef$(this.enterpriseRef),
      ]
    ).subscribe(([ products, licenses]) => {
      this.products = products

      const licensesInList: LicensesInList[] = licenses.map(license => {
        const licenseProduct = products.find(product => product?.id === license?.productRef?.id)
        return {
          productName: licenseProduct?.name ? licenseProduct?.name : 'Licencias',
          acquired: license.quantity,
          used: license.quantityUsed,
          avaliable: license.quantity - license.quantityUsed,
          valid: license.currentPeriodEnd,
          rotations: license.rotations,
          rotationsUsed: license.rotationsUsed,
          avaliableRotations: license.rotations - license.rotationsUsed,
          start: license.currentPeriodStart,
          status: SubscriptionClass.statusToDisplayValueDict[license.status]
        }
      })
      // console.log("licensesInList", licensesInList)
      this.dataSource.data = licensesInList

    })
  }


  async addLicense() {
    let licences =this.dataSource.data
    let licenceActive = licences.find(x=> x.status == "Activo")

    let dateStart = null

    if(licenceActive){
      dateStart = licenceActive.start
    }

    const dialogRef = this.dialog.open(DialogCreateLicenseComponent, {
      data: {
        products: this.products,
        dateStart: dateStart
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: License) => {
      if (result) {
        result.enterpriseRef = this.enterpriseRef;
        try {
          await this.licenseService.saveLicense(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
        }
      }
    });

  }


  ngOnDestroy() {
    if (this.licenseSubscription) this.licenseSubscription.unsubscribe()
  }


}
