import { Component } from '@angular/core';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.css']
})
export class LicenseComponent {

  constructor (
    public icon:IconService,
  ){}

  supportFlag = false

  questions: string[] = [
    "¿Cómo puedo adquirir una licencia?",
    "¿Cuánto cuesta una licencia?",
    "¿Puedo transferir una licencia a otro usuario?",
    "¿Cuáles son las opciones de pago disponibles para adquirir una licencia?",
    "¿Cuál es la duración de una licencia estándar?",
    "¿Cuánto tiempo lleva el proceso de entrega de la licencia una vez realizada la compra?",
    "¿Qué sucede si necesito agregar más licencias después de la compra inicial?",
    "¿Qué opciones de facturación y pago están disponibles para las licencias de acceso?",
    "¿Mi licencia se renueva automáticamente?",
    "¿Ofrecen descuentos por volumen?"
  ];


  ngOnInit(): void{

  }

 

}
