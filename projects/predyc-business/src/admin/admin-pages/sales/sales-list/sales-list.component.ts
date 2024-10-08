import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom, take } from 'rxjs';
import { chargeData } from 'projects/predyc-business/src/assets/data/charge.data';
import { Charge, ChargeJson } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';


@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent {

  constructor(
    private router: Router,
    private chargeService: ChargeService,
    private productService: ProductService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
  ){}

  displayedColumns: string[] = [
    "product",
    "clientShow",
    "monto",
    "date",
    "p21Predyc",
    "metodoPago",
    "dividir",
    "tipo",
    "vendedor",
    "notas"
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  @Input() updateList: number = 0


  pageSize: number = 20
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  chargeSubscription: Subscription

  products: Product[]
  users: User[]
  enterprises: Enterprise[]

  @Output() datosClientes = new EventEmitter<any>();
  @Output() datosVentas = new EventEmitter<any>();


  ngOnChanges(changes: SimpleChanges) {
    if (changes.updateList) {
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        const quarter = params['filterQuarter'] || '';
        this.performSearch(searchTerm, quarter,page);
      })    
    }
  }

  montoPeriodo = 0
  montoPeriodoProcesed = 0

  chargesProceced = [];

  procesarPagosNormalizadoas(charges){

    let quearterInit ='Q3 2023';
    this.chargesProceced = [];
    const { start, end } = this.getQuarterDates(quearterInit); // Usamos la función para obtener las fechas de inicio y fin
    let display = charges.filter(x => x.date.seconds * 1000 > start);
    display = structuredClone(display);
    display.forEach(charge => {
      if(charge.payAt){
        charge.createdAt = charge.payAt;
      }
      if(charge.dividir){
        let fechaini = charge.date.seconds * 1000;
        let amountpagos = ((charge.monto)/12).toFixed(2);
        for(let i = 0; i < 12; i++) {
          let date = new Date(fechaini);
          let originalDay = date.getDate(); // Guardamos el día original
        
          // Ajustamos el mes
          date.setMonth(date.getMonth() + i);
        
          // Si el nuevo mes no tiene el día original, ajustamos al último día del mes
          if (date.getDate() !== originalDay) {
            // Seteamos al día 0 del siguiente mes, que siempre será el último día del mes actual
            date.setDate(0);
          }
        
          let newTimestamp = date.getTime();
          let payLocal = null;
          payLocal = structuredClone(charge);
          payLocal.monto = parseFloat(amountpagos);
          payLocal.description =`Pago Normalizado ${i+1}/12`
          payLocal.date = newTimestamp;
          payLocal.metodoPago = charge.metodoPago;
          payLocal['original'] = charge;
          //console.log(payLocal);
          this.chargesProceced.push(payLocal);
        }
      }
      else{
        let date = new Date(charge.date.seconds * 1000);
        let newTimestamp = date.getTime();
        let payLocal = null;
        payLocal = structuredClone(charge);
        payLocal.monto = parseFloat(charge.monto);
        payLocal.description = `Pago Normalizado (único)`
        payLocal.date = newTimestamp;
        payLocal.metodoPago = charge.metodoPago;
        //console.log(payLocal);
        this.chargesProceced.push(payLocal);
      }
    });
    this.chargesProceced.sort((a, b) => b.date - a.date)
    //console.log('chargesProceced',this.chargesProceced)
  }

  ngOnInit() {

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.productService.getProducts$(), 
        this.userService.getAllUsers$(),
        this.enterpriseService.getAllEnterprises$(),
      ]
    ).
    subscribe(([ products, users, enterprises]) => {
      this.products = products
      this.users = users
      this.enterprises = enterprises

      let datos = {
        products: products,
        users: users,
        enterprises: enterprises,
      }
      this.datosClientes.emit(datos)

      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        const quarter = params['filterQuarter'] || '';
        this.performSearch(searchTerm, quarter,page);
      })
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  allCharges
  filteredChargesNormaliced

  performSearch(searchTerm:string,quarter:string, page: number) {
    this.chargeSubscription = this.chargeService.getCharges$().pipe(take(1)).subscribe(charges => {
      const chargesInList: any[] = charges.map(charge => {
        return {
          ... charge,
          // productName: productData.name,
          // customerName: this.getCustomerName(charge),
          // customerEmail: this.getCustomerEmail(charge),
        }
      })

      //console.log('chargesInList',chargesInList)
      this.allCharges= chargesInList
      this.procesarPagosNormalizadoas(this.allCharges)

      let filteredCharges = chargesInList;
      let filteredChargesNormaliced = this.chargesProceced;


      // Filtrado por trimestre si quarter está definido
      if (quarter && quarter.trim() !== '') {
        const { start, end } = this.getQuarterDates(quarter); // Usamos la función para obtener las fechas de inicio y fin
        filteredCharges = filteredCharges.filter(sub => {
          const chargeDate = sub.date.seconds * 1000; // Convertimos la fecha de Firebase a milisegundos
          return chargeDate >= start && chargeDate <= end; // Filtramos las transacciones que están dentro del rango
        });
        filteredChargesNormaliced = filteredChargesNormaliced.filter(sub => {
          const chargeDate = sub.date; // Convertimos la fecha de Firebase a milisegundos
          return chargeDate >= start && chargeDate <= end; // Filtramos las transacciones que están dentro del rango
        });
      }
  
      // Filtrado por término de búsqueda si searchTerm está definido
      if (searchTerm && searchTerm.trim() !== '') {
        filteredCharges = filteredCharges.filter(sub => 
          sub.clientShow.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }


      this.montoPeriodo = 0
      this.montoPeriodoProcesed = 0

      //console.log('filteredCharges',filteredCharges)

      filteredChargesNormaliced.forEach(element => {
        //console.log('elementfilteredChargesNormaliced',element)
        this.montoPeriodoProcesed+=(element.monto?element.monto:0)
      });
      filteredCharges.forEach(element => {
        if(!element.monto){
          //console.log('element.monto',element)
        }
        this.montoPeriodo+=(element.monto?element.monto:0)
      });
      filteredChargesNormaliced = filteredChargesNormaliced.sort((a, b) => b.date - a.date)
      //console.log('montoPeriodo',this.montoPeriodo,this.montoPeriodoProcesed)

      let datos = {
        montoPeriodo:this.montoPeriodo,
        montoPeriodoProcesed:this.montoPeriodoProcesed,
        ventasNormalizado:filteredChargesNormaliced,
      }

      this.datosVentas.emit(datos)


      this.filteredChargesNormaliced = filteredChargesNormaliced
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredCharges;
      this.totalLength = filteredCharges.length;


    })
  }

  getQuarterDates(quarterString: string): { start: number, end: number } {
    // Dividimos el string para obtener el trimestre y el año
    const [quarter, yearString] = quarterString.split(' ');
    const year = parseInt(yearString, 10); // Convertimos el año a número
    
    let startMonth: number;
    let endMonth: number;
  
    // Determinamos los meses según el trimestre
    switch (quarter) {
      case 'Q1':
        startMonth = 0; // Enero (mes 0)
        endMonth = 2;   // Marzo (mes 2)
        break;
      case 'Q2':
        startMonth = 3; // Abril (mes 3)
        endMonth = 5;   // Junio (mes 5)
        break;
      case 'Q3':
        startMonth = 6; // Julio (mes 6)
        endMonth = 8;   // Septiembre (mes 8)
        break;
      case 'Q4':
        startMonth = 9; // Octubre (mes 9)
        endMonth = 11;  // Diciembre (mes 11)
        break;
      default:
        throw new Error('Invalid quarter');
    }
  
    // Creamos las fechas de inicio y fin en timestamp (milisegundos)
    const startDate = new Date(year, startMonth, 1).getTime(); // Primer día del mes de inicio
    const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59, 999).getTime(); // Último día del mes de fin
  
    return { start: startDate, end: endDate };
  }
  

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getProductData(productId: string): Product {
    return this.products.find(product => product.id === productId)
  }

  getCustomerEmail(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.email
    else return "Empresa"
  
  }

  getCustomerName(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.displayName
    else {
      const enterpriseData: Enterprise = this.enterprises.find(enterprise => enterprise.id === charge.customer.id)
      return enterpriseData.name
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

  // -------------------------------------
  // async createTestData() {
  //   // const prices = await firstValueFrom(this.priceService.getPrices$())
  //   const pricesRef = this.prices.map(price => { return this.priceService.getPriceRefById(price.id) } )

  //   const users = await firstValueFrom(this.userService.getAllUsers$())
  //   const usersRef = users.map(user=> { return this.userService.getUserRefById(user.uid) } )

  //   const enterprises = await firstValueFrom(this.enterpriseService.getAllEnterprises$())
  //   const enterprisesRef = enterprises.map(enterprise => { return this.enterpriseService.getEnterpriseRefById(enterprise.id) } )
    
  //   // const customerRefs = [...usersRef, ...enterprisesRef];
  //   const getRandomElement = (arr: any) => arr[Math.floor(Math.random() * arr.length)];

  //   for (let charge of chargeData ) {
  //     charge.price = getRandomElement(pricesRef);

  //     if (Math.random() > 0.5) charge.customer = getRandomElement(enterprisesRef)
  //     else charge.customer = getRandomElement(usersRef)

  //     await this.chargeService.saveCharge(charge as Charge)
  //   }
  //   console.log(`Finished Creating charges`)
  // }
  // -------------------------------------
}
