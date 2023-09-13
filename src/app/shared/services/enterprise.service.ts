import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {

  constructor() { }

  public enterprise = {
    id: 'empresaPruebaId',
    name: 'Empresa prueba'
  }
}
