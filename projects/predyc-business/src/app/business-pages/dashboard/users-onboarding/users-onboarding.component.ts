import {Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-users-onboarding',
  templateUrl: './users-onboarding.component.html',
  styleUrls: ['./users-onboarding.component.css']
})
export class UsersOnboardingComponent {

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
  studentWihPLan = 0
  fistAccesCompleted = 0
  withDiagnostic = 0
  withFistClass = 0

  studentWihPLanPorcentage = 0
  fistAccesCompletedPorcentage = 0
  withDiagnosticPorcentage = 0
  withFistClassPorcentage = 0

  data = [];

  processData() {

    if(this.users){

      this.data = [];

      let usersActive = this.users.filter(x=>x.status == 'active')
      this.usersTotal = usersActive.length
      // console.log('usersActive',usersActive)
  
      if(this.enterprise.examenInicial  === undefined || this.enterprise?.examenInicial){
        this.examenInicial = true
  
      }
      else{
        this.examenInicial = false
      }
  
      this.studentWihPLan = usersActive.filter(x=>x.studyPlan.length>0).length
      this.studentWihPLanPorcentage = this.studentWihPLan*100/this.usersTotal
      this.fistAccesCompleted = usersActive.filter(x=>x.activityStatusText!='Sin inicio sesión').length
      this.fistAccesCompletedPorcentage = this.fistAccesCompleted*100/this.usersTotal
      this.withDiagnostic = usersActive.filter(x=>x.activityStatusText!='Sin inicio sesión' && x.activityStatusText!='Sin diagnostico completado').length
      this.withDiagnosticPorcentage = this.withDiagnostic*100/this.usersTotal
      this.withFistClass = usersActive.filter(x=>x.activityStatusText!='Sin inicio sesión' && x.activityStatusText!='Sin diagnostico completado' &&  x.activityStatusText!='Sin clases vistas').length
      this.withFistClassPorcentage = this.withFistClass*100/this.usersTotal
    }
  }

  navigateToStudents(filter) {

    if(filter=='planDeEstudio'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ritmo:'no plan'}});
    }
    else if (filter=='primerAcceso'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio sesión'}});
    }
    else if (filter=='diagnostico'){
      this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio y sin diagnóstico'}});
    }

    else if (filter=='primeraClase'){
      if(this.examenInicial){
        this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio, sin diagnóstico y sin clases vistas'}});
      }
      else{
        this.router.navigate(['management/students'], { queryParams: { status: "active" ,ultActivity:'Sin inicio y sin clases vistas'}});
      }
    }
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.processData()
  }

}
