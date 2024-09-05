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
    { name: 'Leads', color: '#f0e68c' ,cards:[]},
    { name: 'Sin negocio', color: '#f5deb3',cards:[] },
    { name: 'Con negocio abierto', color: '#ffa07a',cards:[] },
    { name: 'Solo negocios cerrados', color: '#90ee90' ,cards:[]},
    { name: 'Stats 2024', color: '#d3d3d3',cards:[] }
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
          leadsColumn.name = leadsColumn?.name + ` (${leadsData.length})`
          leadsColumn.cards = leadsData
        }
        // leadsColumn.cards = leadsData
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




}
