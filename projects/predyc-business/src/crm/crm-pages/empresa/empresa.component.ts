import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { CrmService } from 'projects/predyc-business/src/shared/services/crm.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { filter, take } from 'rxjs';
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";

@Component({
  selector: 'app-empresa-crm',
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.css']
})
export class EmpresaCRMComponent {

  constructor(
    private authService: AuthService,
    private instructorsService:InstructorsService,
    private afs: AngularFirestore,
    private crmService: CrmService,
    public icon:IconService,
    private _snackBar: MatSnackBar,
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,
    private router: Router,
    private route: ActivatedRoute,
  ) 
  {
  }
  currentUrl
  intructor
  columns = [
    { name: 'Leads', color: '#f0e68c' ,cards:[],total:0,cantidad:0},
    { name: 'Sin negocio', color: '#f5deb3',cards:[],total:0,cantidad:0 },
    { name: 'Con negocio abierto', color: '#ffa07a',cards:[],total:0,cantidad:0 },
    { name: 'Solo negocios cerrados', color: '#90ee90' ,cards:[],total:0,cantidad:0},
    { name: 'Stats 2024', color: '#d3d3d3',cards:[],total:0 ,cantidad:0}
  ];

  asesores = []

  formNewEmpresa: FormGroup;
  empresa

  empresaId = this.route.snapshot.paramMap.get('id');


  ngOnInit() {
    this.authService.user$.subscribe(async (user) => {

      console.log('user',user)
      let validUsers = await this.crmService.getUserCRM()
      console.log('validUsers',validUsers)
      this.asesores = validUsers

      this.crmService.getEmpresabyID(this.empresaId).subscribe({
        next: (empresaData) => {
            console.log('Datos de la empresa:', empresaData);

            this.empresa = empresaData
            // Aquí puedes hacer algo con los datos de la empresa
        },
        error: (error) => {
            console.error('Error obteniendo la empresa:', error);
        },
        complete: () => {
            console.log('Suscripción completada');
        }
    });
    
    });
  }

  showArchivados = false

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
    delete leadToSave['editingCantidad']

    delete leadToSave['editingSource']
    delete leadToSave['editingMedium']
    delete leadToSave['editingCampaign']

    delete leadToSave['nameAsesor']



    console.log('leadToSave',leadToSave)
    

    //let respuesta = this.crmService.saveLead(leadToSave)

  }
  getTotalSeccion(seccion) {
    console.log(seccion, this.columns);

    // Encuentra las tarjetas en la sección especificada.
    let cards = this.columns.find(x => x.name === seccion).cards;
    cards = cards.filter(x=>!x.archivado)

    return cards.length;
  }
  getTotalAmountSeccion(seccion) {
    console.log(seccion, this.columns);

    // Encuentra las tarjetas en la sección especificada.
    let cards = this.columns.find(x => x.name === seccion).cards;
    cards = cards.filter(x=>!x.archivado)
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

  selectedLead = null

  showErrorEmpresaNew = false

  handleBlur(editingField: string, card: any): void {
    card[editingField] = false;
    this.savelead(card);
  }

    currentModal
    openModal(modal,size = 'sm') {
      this.currentModal = this.modalService.open(modal, {
        ariaLabelledBy: "modal-basic-title",
        centered: true,
        size: size,
      });
    }


 
    asignarAsesor(event: Event, lead: any): void {
      const selectedValue = (event.target as HTMLSelectElement).value;
      lead.idAsesor = selectedValue;
      this.savelead(lead)

      const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
      lead.nameAsesor = asesor.name   
      // Lógica adicional para guardar el cambio si es necesario
      console.log('Asesor asignado:', lead.idAsesor);
  }


  archivarCard() {

    if( this.selectedLead?.archivado){
      Swal.fire({
        title: `¿Está seguro que desea desarchivar la tarjeta ${this.selectedLead.title}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#9ca6af',
        confirmButtonText: 'Archivar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
          if (result.isConfirmed) {
              this.selectedLead.archivado = false
              this.savelead(this.selectedLead);
          }
      });
    }
    else{
      Swal.fire({
        title: `¿Está seguro que desea archivar la tarjeta ${this.selectedLead.title}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#9ca6af',
        confirmButtonText: 'Archivar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
          if (result.isConfirmed) {
              this.selectedLead.archivado = true
              this.savelead(this.selectedLead);
          }
      });

    }

}





}
