import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { License } from '../models/license.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  getLicensesObservableByEnterpriseRef(enterpriseDocRef: any): Observable<License[]> {
    return this.afs.collection<License>(License.collection, ref => 
      ref.where('enterpriseRef', '==', enterpriseDocRef).orderBy('createdAt', 'desc')
    ).valueChanges()
  }
}
