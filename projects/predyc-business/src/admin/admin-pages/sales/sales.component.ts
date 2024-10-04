import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Observable, map, of, startWith } from 'rxjs';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {

  constructor(
    public icon:IconService,
    private modalService: NgbModal,
    private fb: FormBuilder,
  ){


  }

  datosClientes
  createSaleModal
  displayErrors = false
  createSaleForm: FormGroup;

  users
  empresas
  productos


  filteredUsers: Observable<any[]>; // Observable para el autocomplete de independientes
  filteredEmpresas: Observable<any[]>; // Observable para el autocomplete de empresas

  selectedUser: any; // Valor seleccionado para independiente
  selectedEmpresa: any; // Valor seleccionado para empresa

  tipoCliente

  getDatosClientes(datosClientes){
    console.log(datosClientes)
    this.users = datosClientes.users.filter(x=>!x.enterprise)
    this.empresas = datosClientes.enterprises
    this.productos=datosClientes.products
  }


  createVenta(modal) {
    this.displayErrors = false
    this.createSaleForm = this.fb.group({
      tipoCliente: ['', [Validators.required]],
      user: [''],  // Campo para 'independiente'
      enterprise: [''],  // Campo para 'empresa'
      plan: ['', [Validators.required]],
      monto: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      p21Predyc: ['', [Validators.required]],
      metodoPago: ['', [Validators.required]],
      dividir: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      vendedor: ['', [Validators.required]],
      notas: [''],


    });

    // Manejar los cambios de valor en el campo tipoCliente
    this.createSaleForm.get('tipoCliente').valueChanges.subscribe(value => {
      this.tipoCliente = value;
    });

    let eventFlaso = {
      target:{
        value:''
      }
    }

    this.onTipoClienteChange(eventFlaso);

    this.createSaleModal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "lg",
    });
  }

  // Método para manejar el cambio del tipo de cliente
  onTipoClienteChange(event: any) {
    const value = event.target.value; // Obtenemos el valor del evento
    this.tipoCliente = value;

    // Limpiar validaciones anteriores
    this.createSaleForm.get('user').clearValidators();
    this.createSaleForm.get('enterprise').clearValidators();

    if (value === 'independiente') {
      // Si es independiente, hacemos 'user' requerido
      this.createSaleForm.get('user').setValidators([Validators.required]);
      this.createSaleForm.get('enterprise').reset();  // Limpiar enterprise
      this.filteredUsers = of(this.users);  // Inicializar el filtro para independientes
    }

    if (value === 'empresa') {
      // Si es empresa, hacemos 'enterprise' requerido
      this.createSaleForm.get('enterprise').setValidators([Validators.required]);
      this.createSaleForm.get('user').reset();  // Limpiar user
      this.filteredEmpresas = of(this.empresas);  // Inicializar el filtro para empresas
    }

    // Asegúrate de actualizar el estado del formulario
    this.createSaleForm.get('user').updateValueAndValidity();
    this.createSaleForm.get('enterprise').updateValueAndValidity();
  }

  // Método que se activa al filtrar usuarios independientes
  filterUsers(event: any) {
    const filterValue = event.target.value.toLowerCase(); // Obtenemos el valor del evento dentro de la función
    this.filteredUsers = of(this.users).pipe(
      map(users => users.filter(user => user.email.toLowerCase().includes(filterValue)))
    );
  }

  // Método que se activa al filtrar empresas
  filterEmpresas(event: any) {
    const filterValue = event.target.value.toLowerCase(); // Obtenemos el valor del evento dentro de la función
    this.filteredEmpresas = of(this.empresas).pipe(
      map(empresas => empresas.filter(empresa => empresa.name.toLowerCase().includes(filterValue)))
    );
  }

  // Función para mostrar el email del usuario en el campo de selección
    displayEmail(user: any): string {
      return user && user.email ? user.email : '';
    }

    // Función para mostrar el nombre de la empresa en el campo de selección
    displayName(empresa: any): string {
      return empresa && empresa.name ? empresa.name : '';
    }

  // Método para enviar el formulario
  onSubmit() {
    this.displayErrors = false
    console.log(this.createSaleForm)
    if (this.createSaleForm.valid) {
      console.log('Formulario válido:', this.createSaleForm.value);
    } else {
      this.displayErrors = true
      console.log('Formulario no válido');
    }
  }


  

}
