import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,) 
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
  empresas = []


  ngOnInit() {
    this.authService.user$.subscribe(async (user) => {

      console.log('user',user)
      let validUsers = await this.crmService.getUserCRM()
      console.log('validUsers',validUsers)
      this.asesores = validUsers
      this.crmService.getDashboardDataObservable()
        .pipe()
        .subscribe((dashboardData) => {
          console.log("this.leads", dashboardData);
          let leads = dashboardData['leads']

          //Leads INICIO
          leads.forEach(lead => {
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
          // Actualizar la columna Leads con los datos procesados
          let leadsColumn = this.columns.find(x => x.name == 'Leads');
          if (leadsColumn && leadsColumn.name && leads.length > 0) {
            leadsColumn.cards = leads
          }
          // Obtener el total de la sección
          let amaount = this.getTotalAmountSeccion('Leads');
          let cantidad = this.getTotalSeccion('Leads');
          leadsColumn.total = amaount;
          leadsColumn.cantidad = cantidad;

          //Leads FIN

          let empresas = dashboardData['enterprises']
          console.log('empresas',empresas)
          this.empresas = empresas






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
    

    let respuesta = this.crmService.saveLead(leadToSave)

    
    console.log(respuesta)
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


    openModalEmpresasNew(modal,size = 'sm'){

      this.formNewEmpresa = new FormGroup({
        nombre: new FormControl("", Validators.required),
        idAsesor: new FormControl("", Validators.required),
      });
      this.openModal(modal,size)
    }

    async saveEmpresaNew(){

      this.showErrorEmpresaNew = false
      if(this.formNewEmpresa.valid){

        let empresa = this.formNewEmpresa.value
        console.log(empresa)
        empresa.nombre = empresa.nombre.toLowerCase().trim()

        let empresaFind =this.empresas.find(x => x.nombre == empresa.nombre)

        console.log('empresaFind',empresaFind)

        if (empresaFind) { // Ya hay una empresa con ese nombre
          Swal.fire({
              icon: 'warning',
              title: 'Advertencia',
              text: 'Ya existe una empresa con ese nombre.',
              confirmButtonText: 'Aceptar'
          });
      } else {
          await this.crmService.saveEmpresa(empresa);
          
          Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'La empresa se ha guardado exitosamente.',
              confirmButtonText: 'Ir a la empresa',
              showCancelButton: true,
              cancelButtonText: 'cerrar'
          }).then((result) => {
              if (result.isConfirmed) {
                  // Redirigir al enlace de la empresa creada
                  window.location.href = `/ruta-a-la-empresa/${empresa.id}`; // Ajusta la ruta según sea necesario
              }
          });
      }
      
      }
      else{
        this.showErrorEmpresaNew = true
      }

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

descargarDatosFoms() {
  this.enterpriseService.getFormsData$().pipe(take(1)).subscribe((eventos) => {
    const eventosProcesados = eventos.map(evento => {
      // Convertir fechas de Firebase
      const eventoConFecha = this.convertirFechasFirebase(evento);

      // Extraer valores de 'origen'
      if(eventoConFecha?.origen){
        const urlParts = eventoConFecha.origen.split('?');
        const baseUrl = 'https://predyc.com'; // Base URL
  
        // Asignar los parámetros UTM si existen
        const url = new URLSearchParams(urlParts[1] || '');
        eventoConFecha.source = url.get('utm_source') || '';
        eventoConFecha.medium = url.get('utm_medium') || '';
        eventoConFecha.campaign = url.get('utm_campaign') || '';
  
        // Crear el nuevo campo con el origen sin parámetros
        eventoConFecha.origenBase = `${baseUrl}${urlParts[0]}`;
  
      }

      return eventoConFecha;
    });

    // Exportar a Excel si hay datos
    if (eventosProcesados && eventosProcesados.length > 0) {
      this.exportToExcel(eventosProcesados, 'forms_data');
    }
  });
}


// Método para convertir las marcas de tiempo de Firebase a objetos Date
convertirFechasFirebase(obj: any): any {
  Object.keys(obj).forEach(key => {
    const value = obj[key];

    // Verificar si el valor es un objeto con la propiedad `seconds`
    if (value && value.seconds) {
      const date = new Date(value.seconds * 1000);
      obj[key] = date;  // Asigna directamente el objeto Date
    }
  });

  return obj;  // Devolver el objeto con las fechas convertidas a Date
}

// Método para exportar a Excel
exportToExcel(jsonData: any[], fileName: string): void {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook: XLSX.WorkBook = {
    Sheets: { 'data': worksheet },
    SheetNames: ['data']
  };
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}






}
