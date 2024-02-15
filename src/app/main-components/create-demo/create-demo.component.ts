import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';

@Component({
  selector: 'app-create-demo',
  templateUrl: './create-demo.component.html',
  styleUrls: ['./create-demo.component.css']
})
export class CreateDemoComponent {

  enterpriseName: string

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore
  ) {}

  createDemo() {
    try {
      if (!this.enterpriseName) throw Error("Debe colocarle un nombre a la empresa")
      this.afs.collection<Enterprise>(Enterprise.collection, ref => ref.where("name", "==", this.enterpriseName)).get()
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(error)
    }
  }

}
