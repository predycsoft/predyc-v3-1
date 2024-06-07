import {Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-users-activity',
  templateUrl: './users-activity.component.html',
  styleUrls: ['./users-activity.component.css']
})
export class UsersaAtivityComponent {

  ctx : any;
  config : any;
  chartData : number[] = [];
  chartDatalabels : string[] = [];

  constructor(
    public icon: IconService,
    private router: Router



  ){}
  @Input() users
  @Input() enterprise
  examenInicial
  usersTotal = 0
  ultimos15Dias = 0
  ultimos30Dias = 0
  mas30Dias = 0
  sinActividad = 0

  ultimos15DiasPorcentage = 0
  ultimos30DiasPorcentage = 0
  mas30DiasPorcentage = 100
  sinActividadPorcentage  = 0


  data = [];

  processData(){
    
    this.data = [];

    let usersActive = this.users.filter(x=>x.status == 'active')
    this.usersTotal = usersActive.length
    console.log('usersActiveActivities',usersActive)

    if(this.enterprise.examenInicial  === undefined || this.enterprise?.examenInicial){
      this.examenInicial = true

    }
    else{
      this.examenInicial = false
    }

    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    
    
    this.ultimos15Dias = usersActive.filter(user => {
      const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate.seconds * 1000) : null;
      return lastActivityDate && lastActivityDate >= fifteenDaysAgo;
    }).length;

    this.ultimos15DiasPorcentage = this.ultimos15Dias*100/this.usersTotal
    this.ultimos30Dias = usersActive.filter(user => {
      const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate.seconds * 1000) : null;
      return lastActivityDate && lastActivityDate >= thirtyDaysAgo && lastActivityDate <= fifteenDaysAgo;
    }).length;

    this.ultimos30DiasPorcentage = this.ultimos30Dias*100/this.usersTotal
    
    this.mas30Dias = usersActive.filter(user => {
      const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate.seconds * 1000) : null;
      return lastActivityDate && lastActivityDate < thirtyDaysAgo;
    }).length;
    this.mas30DiasPorcentage = this.mas30Dias*100/this.usersTotal


    this.sinActividad = usersActive.filter(x=>x.activityStatusText=='Sin inicio sesión' || x.activityStatusText=='Sin diagnostico completado' ||  x.activityStatusText=='Sin clases vistas').length
    this.sinActividadPorcentage = this.sinActividad*100/this.usersTotal


  }
  

  ngOnInit() {


  }

  ngOnChanges(changes: SimpleChanges) {
    this.processData()
    


  }


  navigateToStudents(filter){

    if(filter=='ultimos15Dias'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Menos de 15 días'}});
    }
    if(filter=='ultimos30Dias'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Entre 15 y 30 días'}});
    }
    if(filter=='mas30Dias'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Más de 30 días'}});
    }
    if(filter=='sinActividad'){
      if(this.examenInicial){
        this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio, sin diagnóstico y sin clases vistas'}});
      }
      else{
        this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio y sin clases vistas'}});
      }
    }

  }



}
