import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {

  // enterpriseSubject: 
  // enterprise$: Observable<any>

  constructor(private authService: AuthService) {
    // this.authService.user$.subscribe(user => {
    //   if (user) {

    //   } else {

    //   }
    // })
  }

  public enterprise = {
    id: 'empresaPruebaId',
    name: 'Empresa prueba'
  }
}
