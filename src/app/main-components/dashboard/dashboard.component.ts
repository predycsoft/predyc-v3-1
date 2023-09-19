import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Enterprise, testEnterprise } from 'src/app/shared/models/enterprise.model';
import { LoaderService } from 'src/app/shared/services/loader.service';



@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  constructor(
    private loaderService: LoaderService,
    private afs: AngularFirestore
  ) {}

  // async createTestEnterprise() {
  //   const enterprise = await this.afs.collection(Enterprise.collection).doc(testEnterprise.id).set(testEnterprise.toJson());
  //   console.log("enterprise")
  //   console.log(enterprise)
  //   console.log("DONE!")
  // }

}
