import { CdkDragDrop } from '@angular/cdk/drag-drop';
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


  columnsOG = [
    { name: 'Abiertas', id:'opened',color: '#f0e68c' ,cards:[],total:0,cantidad:0},
    { name: 'En proceso',id:'inprocess', color: '#f5deb3',cards:[],total:0,cantidad:0 },
    { name: 'En cierre',id:'clossing', color: '#ffa07a',cards:[],total:0,cantidad:0 },
    { name: 'Ganadas',id:'closed', color: '#90ee90' ,cards:[],total:0,cantidad:0},
    { name: 'Perdidas',id:'lost', color: '#808080' ,cards:[],total:0,cantidad:0},
    { name: 'Notas',id:'', color: '#d3d3d3',cards:[],total:0 ,cantidad:0}
  ];

  columns = [
    { name: 'Abiertas', id:'opened',color: '#f0e68c' ,cards:[],total:0,cantidad:0},
    { name: 'En proceso',id:'inprocess', color: '#f5deb3',cards:[],total:0,cantidad:0 },
    { name: 'En cierre',id:'clossing', color: '#ffa07a',cards:[],total:0,cantidad:0 },
    { name: 'Ganadas',id:'closed', color: '#90ee90' ,cards:[],total:0,cantidad:0},
    { name: 'Perdidas',id:'lost', color: '#808080' ,cards:[],total:0,cantidad:0},
    { name: 'Notas',id:'', color: '#d3d3d3',cards:[],total:0 ,cantidad:0}
  ];


  asesores = []

  formNewEmpresa: FormGroup;
  empresa

  empresaId = this.route.snapshot.paramMap.get('id');
  asesorEmpresa = null

  ngOnInit() {
    this.authService.user$.subscribe(async (user) => {

      console.log('user',user)
      let validUsers = await this.crmService.getUserCRM()
      console.log('validUsers',validUsers)
      this.asesores = validUsers

      this.crmService.getEmpresabyID(this.empresaId).subscribe({
        next: (empresaData) => {
            console.log('Datos de la empresa:', empresaData);
            this.columns =  structuredClone (this.columnsOG)

            this.empresa = empresaData
            this.asesorEmpresa = this.asesores.find(x=>x.uid ==empresaData.idAsesor )

            //Abiertas INICIO
            let opened =  this.empresa.opened
            opened.forEach(lead => {
              lead.typeCard = 'lead';
              // Extraer valores del campo 'origen' si existe
              if (lead.origen && !lead.origenBase) {
                const urlParts = lead.origen.split('?');
                const url = new URLSearchParams(urlParts[1] || '');
    
                // Agregar los campos source, medium, y campaign
                lead.source = url.get('utm_source') || '';
                lead.medium = url.get('utm_medium') || '';
                lead.campaign = url.get('utm_campaign') || '';
    
                // Crear el nuevo campo con el origen base
                lead.origenBase = `https://predyc.com${urlParts[0]}`;
              }

              if(lead.idAsesor){

                const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
                lead.nameAsesor = asesor.name
              }
            });
            // Actualizar la columna opened con los datos procesados
            let openedColumn = this.columns.find(x => x.name == 'Abiertas');
            if (openedColumn && openedColumn.name && opened.length > 0) {
              openedColumn.cards = opened
            }
            // Obtener el total de la sección
            let amaount = this.getTotalAmountSeccion('Abiertas');
            let cantidad = this.getTotalSeccion('Abiertas');
            openedColumn.total = amaount;
            openedColumn.cantidad = cantidad;
            //Abiertas FIN

            //inprocess INICIO
            let inprocess =  this.empresa.inprocess
            inprocess.forEach(lead => {
              lead.typeCard = 'inprocess';
              // Extraer valores del campo 'origen' si existe
              if (lead.origen && !lead.origenBase) {
                const urlParts = lead.origen.split('?');
                const url = new URLSearchParams(urlParts[1] || '');
    
                // Agregar los campos source, medium, y campaign
                lead.source = url.get('utm_source') || '';
                lead.medium = url.get('utm_medium') || '';
                lead.campaign = url.get('utm_campaign') || '';
    
                // Crear el nuevo campo con el origen base
                lead.origenBase = `https://predyc.com${urlParts[0]}`;
              }

              if(lead.idAsesor){

                const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
                lead.nameAsesor = asesor.name
              }
            });
            // Actualizar la columna inprocess con los datos procesados
            let inprocessColumn = this.columns.find(x => x.name == 'En proceso');
            if (inprocessColumn && inprocessColumn.name && inprocess.length > 0) {
              inprocessColumn.cards = inprocess
            }
            // Obtener el total de la sección
            amaount = this.getTotalAmountSeccion('En proceso');
            cantidad = this.getTotalSeccion('En proceso');
            inprocessColumn.total = amaount;
            inprocessColumn.cantidad = cantidad;
            //inprocess FIN


            //clossing INICIO
            let clossing =  this.empresa.clossing
            clossing.forEach(lead => {
              lead.typeCard = 'clossing';
              // Extraer valores del campo 'origen' si existe
              if (lead.origen && !lead.origenBase) {
                const urlParts = lead.origen.split('?');
                const url = new URLSearchParams(urlParts[1] || '');
    
                // Agregar los campos source, medium, y campaign
                lead.source = url.get('utm_source') || '';
                lead.medium = url.get('utm_medium') || '';
                lead.campaign = url.get('utm_campaign') || '';
    
                // Crear el nuevo campo con el origen base
                lead.origenBase = `https://predyc.com${urlParts[0]}`;
              }

              if(lead.idAsesor){

                const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
                lead.nameAsesor = asesor.name
              }
            });
            // Actualizar la columna clossing con los datos procesados
            let clossingColumn = this.columns.find(x => x.name == 'En cierre');
            if (clossingColumn && clossingColumn.name && clossing.length > 0) {
              clossingColumn.cards = clossing
            }
            // Obtener el total de la sección
            amaount = this.getTotalAmountSeccion('En cierre');
            cantidad = this.getTotalSeccion('En cierre');
            clossingColumn.total = amaount;
            clossingColumn.cantidad = cantidad;
            //clossing FIN


            //closed INICIO
            let closed =  this.empresa.closed
            closed.forEach(lead => {
              lead.typeCard = 'closed';
              // Extraer valores del campo 'origen' si existe
              if (lead.origen && !lead.origenBase) {
                const urlParts = lead.origen.split('?');
                const url = new URLSearchParams(urlParts[1] || '');
    
                // Agregar los campos source, medium, y campaign
                lead.source = url.get('utm_source') || '';
                lead.medium = url.get('utm_medium') || '';
                lead.campaign = url.get('utm_campaign') || '';
    
                // Crear el nuevo campo con el origen base
                lead.origenBase = `https://predyc.com${urlParts[0]}`;
              }

              if(lead.idAsesor){

                const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
                lead.nameAsesor = asesor.name
              }
            });
            // Actualizar la columna closed con los datos procesados
            let closedColumn = this.columns.find(x => x.name == 'Ganadas');
            if (closedColumn && closedColumn.name && closed.length > 0) {
              closedColumn.cards = closed
            }
            // Obtener el total de la sección
            amaount = this.getTotalAmountSeccion('Ganadas');
            cantidad = this.getTotalSeccion('Ganadas');
            closedColumn.total = amaount;
            closedColumn.cantidad = cantidad;
            //closed FIN


            //closed INICIO
            let lost =  this.empresa.lost
            lost.forEach(lead => {
              lead.typeCard = 'lost';
              // Extraer valores del campo 'origen' si existe
              if (lead.origen && !lead.origenBase) {
                const urlParts = lead.origen.split('?');
                const url = new URLSearchParams(urlParts[1] || '');
    
                // Agregar los campos source, medium, y campaign
                lead.source = url.get('utm_source') || '';
                lead.medium = url.get('utm_medium') || '';
                lead.campaign = url.get('utm_campaign') || '';
    
                // Crear el nuevo campo con el origen base
                lead.origenBase = `https://predyc.com${urlParts[0]}`;
              }

              if(lead.idAsesor){

                const asesor = this.asesores.find(x=>x.id == lead.idAsesor)
                lead.nameAsesor = asesor.name
              }
            });
            // Actualizar la columna lost con los datos procesados
            let lostColumn = this.columns.find(x => x.name == 'Perdidas');
            if (lostColumn && lostColumn.name && lost.length > 0) {
              lostColumn.cards = lost
            }
            // Obtener el total de la sección
            amaount = this.getTotalAmountSeccion('Perdidas');
            cantidad = this.getTotalSeccion('Perdidas');
            lostColumn.total = amaount;
            lostColumn.cantidad = cantidad;
            //closed FIN








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

  showLost = false

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

  async savelead(lead){
    //alert ('aqui')

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
    
    try {
      // Invoca el método saveLeadEmpresa
      let respuesta = await this.crmService.saveCardEmpresa(this.empresaId, leadToSave);
  
      // Si la operación es exitosa, puedes agregar alguna acción aquí (opcional)
      console.log('Lead guardado con éxito:', respuesta);
    } catch (error) {
      // Si ocurre un error, muestra el mensaje en un SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar el lead',
        text: 'Ocurrió un error al intentar guardar el lead. Por favor, intenta de nuevo.',
        footer: `Detalles del error: ${error.message || error}`
      });
    }


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

  async onDrop(event: CdkDragDrop<any[]>) {
  // Obtener el ID de la tarjeta que se ha movido
  const cardId = event.item.element.nativeElement.getAttribute('id');
  // Asegúrate de que event.event.target sea un elemento HTML
  const targetElement = event.event.target as HTMLElement;
  // Obtener el ID de la columna de destino
  const columnDestino = targetElement.getAttribute('id-column'); // Asegúrate de que la columna tenga el atributo name-column
  // Obtener el ID de la columna de origen
  const columnOrigen = event.container.element.nativeElement.getAttribute('id-column');
  // Aquí puedes manejar la lógica para actualizar el estado de la tarjeta, si es necesario

  if(columnDestino && (columnOrigen != columnDestino)){
    await this.crmService.moveCardEmpresa(this.empresaId,cardId,columnOrigen,columnDestino)
    //moveCardEmpresa()

  }

}



}
