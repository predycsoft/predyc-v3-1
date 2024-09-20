import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { CrmService } from 'projects/predyc-business/src/shared/services/crm.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-dashboard-crm',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(
    private authService: AuthService,
    private instructorsService:InstructorsService,
    private afs: AngularFirestore,
    private crmService: CrmService,
    public icon:IconService,
    private _snackBar: MatSnackBar,

  ) 
  {
  }
  currentUrl
  intructor
  columns = [
    { name: 'Leads', color: '#f0e68c' ,cards:[],total:0},
    { name: 'Sin negocio', color: '#f5deb3',cards:[],total:0 },
    { name: 'Con negocio abierto', color: '#ffa07a',cards:[],total:0 },
    { name: 'Solo negocios cerrados', color: '#90ee90' ,cards:[],total:0},
    { name: 'Stats 2024', color: '#d3d3d3',cards:[],total:0 }
  ];


  ngOnInit() {
    this.authService.user$.subscribe(async (user) => {
      this.crmService.getLeadsObservable()
      .pipe()
      .subscribe((leadsData) => {
        console.log("this.leads", leadsData);

        leadsData.forEach(lead => {
          lead.type = 'lead'
        });

        let leadsColumn = this.columns.find(x=>x.name == 'Leads')
        if(leadsColumn && leadsColumn.name && leadsData.length>0){
          //leadsColumn.name = leadsColumn?.name + ` (${leadsData.length})`
          leadsColumn.cards = leadsData
        }
        let amaount = this.getTotalAmountSeccion('Leads')
        leadsColumn.total = amaount
      });



    })

  }

  copiarContacto(message: string = 'Correos copiados', texto,action: string = '') {
    navigator.clipboard.writeText(texto).then(() => {
      this._snackBar.open(message, action, {
        duration: 1000,
        panelClass: ['gray-snackbar'],
      });
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  }

  savelead(lead){

    let leadToSave = structuredClone(lead)
    
    delete leadToSave['editingTitle']
    delete leadToSave['editingValor']
    delete leadToSave['editingProducto']
    delete leadToSave['editingOrigen']

    let respuesta = this.crmService.saveLead(lead)

    
    console.log(respuesta)
  }

  getTotalAmountSeccion(seccion) {
    console.log(seccion, this.columns);

    // Encuentra las tarjetas en la sección especificada.
    const cards = this.columns.find(x => x.name === seccion).cards;

    console.log(cards);

    let amount = 0;

    // Recorre cada tarjeta y suma los valores numéricos válidos.
    cards.forEach(card => {
        if (card.valor) {
            let valor = parseFloat(card.valor);
            // Comprueba si el valor es un número después de convertirlo.
            if (!isNaN(valor)) {
                amount += valor;
            }
        }
    });

    console.log('Total Amount:', amount); // Opcional: para verificación
    return amount;
}

handleKeydown(event: KeyboardEvent, card: any, editingField: string): void {
  if (event.keyCode === 13 || event.keyCode === 9) {
      event.preventDefault();  // Previene la funcionalidad por defecto de la tecla
      this.handleBlur(editingField, card);
      (event.target as HTMLInputElement).blur();
  }
}

handleBlur(editingField: string, card: any): void {
  card[editingField] = false;
  this.savelead(card);
}




}
