import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ComponentLog, ComponentLogJson } from 'projects/shared/models/component-log.model';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  constructor(
    private afs: AngularFirestore,
  ) { }

  async saveComponentLog(logJson: ComponentLogJson) {
    logJson.id = this.afs.createId()
    await this.afs.collection(ComponentLog.collection).doc(logJson.id).set(logJson)
    console.log("Component log saved")
  }
}
