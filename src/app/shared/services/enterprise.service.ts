import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Enterprise } from '../models/enterprise.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {

  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null);
  private enterprise$ = this.enterpriseSubject.asObservable();

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(async user => {
      const enterpriseDocumentReference = await user?.enterprise?.get()
      if (enterpriseDocumentReference) {
        const enterprise = enterpriseDocumentReference.data() as Enterprise
        this.enterpriseSubject.next(enterprise)
      } else {
        this.enterpriseSubject.next(null)
      }
    })
  }

  public getEnterpriseObservable() {
    return this.enterprise$
  }

  public enterprise = {
    id: 'empresaPruebaId',
    name: 'Empresa prueba'
  }
}
