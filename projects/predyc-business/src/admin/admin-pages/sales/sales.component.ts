import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Observable, Subscription, map, of, startWith } from 'rxjs';
import { Enterprise, Product, User } from 'shared';
import { ChargeService } from '../../../shared/services/charge.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    private afs: AngularFirestore,
    private chargeService:ChargeService,
    private router: Router, private route: ActivatedRoute

  ){


  }

  datosClientes
  createSaleModal
  displayErrors = false
  createSaleForm: FormGroup;

  users
  empresas
  productos
  selectedQuarter

  queryParamsSubscription: Subscription



  filteredUsers: Observable<any[]>; // Observable para el autocomplete de independientes
  filteredEmpresas: Observable<any[]>; // Observable para el autocomplete de empresas

  selectedUser: any; // Valor seleccionado para independiente
  selectedEmpresa: any; // Valor seleccionado para empresa

  tipoCliente

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      this.selectedQuarter = params['filterQuarter'] || '';
    })
    this.generateQuarters();

  }

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

  savingSale = false
  async onSubmit() {
    this.displayErrors = false
    console.log(this.createSaleForm)
    if (this.createSaleForm.valid) {
      this.savingSale = true
      console.log('Formulario válido:', this.createSaleForm.value);

      const saleValues = this.createSaleForm.value

      let saleToSave = {
        ...saleValues
      }

      saleToSave.user = null
      saleToSave.enterprise = null


      let productRef = await this.afs.collection<any>(Product.collection).doc(saleValues.plan).ref;
      saleToSave.productRef = productRef
      saleToSave.iDproduct = productRef.id

      if(saleValues.enterprise){
        let enterpriseRef = await this.afs.collection<any>(Enterprise.collection).doc(saleValues.enterprise.id).ref;
        saleToSave.enterpriseRef = enterpriseRef
        saleToSave.enterprise = saleValues.enterprise.name
        saleToSave.idEnterprise = saleValues.enterprise.id
        saleToSave.clientShow = saleToSave.enterprise
      }
      else{
        let userRef = await this.afs.collection<any>(User.collection).doc(saleValues.user.uid).ref;
        saleToSave.userRef = userRef
        saleToSave.user = saleValues.user.name
        saleToSave.idUser = saleValues.user.uid
        saleToSave.clientShow = saleValues.user.email

      }

      saleToSave.dateSave = new Date()
      const [year, month, day] = saleToSave.fecha.split('-').map(Number); // Dividir la fecha en partes
      saleToSave.date = new Date(year, month - 1, day); // Crear un objeto Date en hora local (meses son 0-indexados)


      const producto = this.productos.find(x=>x.id == saleValues.plan)

      saleToSave.productName = producto.name
    
      console.log('saleValues',saleValues,saleToSave)
      await this.chargeService.saveSale(saleToSave)
      this.savingSale = false
      

      this.createSaleModal.close()



    } else {
      this.displayErrors = true
      console.log('Formulario no válido');
    }
  }

  quarters: string[] = [];


    // Generar trimestres desde 2024 hasta el trimestre actual
    generateQuarters() {
      const startYear = 2024;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3); // 1-based quarter calculation
  
      for (let year = startYear; year <= currentYear; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          if (year === currentYear && quarter > currentQuarter) {
            break; // No generar trimestres futuros
          }
          this.quarters.push(`Q${quarter} ${year}`);
        }
      }
    }
  
    // Al cambiar el trimestre, actualizar la URL con el query param
    onQuarterChange(event: Event): void {
      const quarter = (event.target as HTMLSelectElement).value; // Obtenemos el valor del evento dentro de la función
  
      if (quarter === '') {
          // Si es "Todos", eliminamos el query param 'filterQuarter'
          this.router.navigate([], {
              queryParams: {
                  filterQuarter: null
              },
              queryParamsHandling: 'merge'
          });
      } else {
          // Si no, actualizamos el query param con el valor del trimestre seleccionado
          console.log(quarter)
          this.router.navigate([], {
              queryParams: {
                  filterQuarter: quarter
              },
              queryParamsHandling: 'merge'
          });
      }
  }
  


  

}
