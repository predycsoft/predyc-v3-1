import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { DialogRequestLicensesComponent } from 'src/app/shared/components/users/license-student-list/dialog-request-licenses/dialog-request-licenses.component';
import { DialogHistoryLicensesComponent } from 'src/app/shared/components/users/license-student-list/dialog-history-licenses/dialog-history-licenses.component';

import { LicenseStudentListComponent } from 'src/app/shared/components/users/license-student-list/license-student-list.component';
import { License } from 'src/app/shared/models/license.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { LicenseService } from 'src/app/shared/services/license.service';
import Swal from 'sweetalert2';
import { DialogService } from 'src/app/shared/services/dialog.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  
  constructor(
    public icon: IconService,
    public licenseService: LicenseService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private dialogService: DialogService,


  ){}

  licenses$: Observable<License[]> = this.licenseService.geteEnterpriseLicenses$()
  licenses: License[];
  licensesSubscription: Subscription;

  @ViewChild('licenseMenu') licenseMenu: MatMenu;
  @ViewChild('trigger') menuTrigger: MatMenuTrigger;

  selectedUsersIds: string[] = [];
  selectedLicense: License;

  currentStatus: string = 'active';
  queryParamsSubscription: Subscription;

  hasLicenseChanged = 1 //flag to deselect checkboxes after license assign or removed

  today = +new Date()

  totalLicenses: number
  availableLicenses: number
  availableRotations: number
  expirationDate: number
  rotationsWaitingCount : number

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatus = params['status'];
      }
    });

    this.licensesSubscription = this.licenses$.subscribe(licenses => {
      console.log('licenses',licenses)
      if (licenses && licenses.length > 0) {
        this.licenses = licenses;
        let totalLicenses = 0
        let rotationsWaitingCount = 0
        let availableLicenses = 0
        let availableRotations = 0
        let expirationDate = null
        licenses.forEach(license => {
          if (license.status !== 'active') return
          totalLicenses += license.quantity
          console.log('license.rotationsWaitingCount',license.rotationsWaitingCount)
          rotationsWaitingCount += license.rotationsWaitingCount
          availableLicenses += license.quantity - license.quantityUsed
          availableRotations += license.rotations - license.rotationsUsed
          if (!expirationDate || expirationDate < license.currentPeriodEnd) expirationDate = license.currentPeriodEnd
        })
        this.rotationsWaitingCount = rotationsWaitingCount
        this.totalLicenses = totalLicenses
        this.availableLicenses = availableLicenses
        this.availableRotations = availableRotations
        this.expirationDate = expirationDate
        console.log('rotationsWaitingCount',this.rotationsWaitingCount)
        if (!this.selectedLicense) this.selectedLicense = licenses[0]
        else {
          // update selectedLicense values
          this.selectedLicense = licenses.find(license => license.id === this.selectedLicense.id)
        }
      }
    });
  }

  handleSelectedUsers(users: any[]) {
    this.selectedUsersIds = users;
  }

  async selectLicense(license: License,rotation = false) {
    try {      
      await this.licenseService.assignLicense(license, this.selectedUsersIds,rotation);
      this.hasLicenseChanged = -this.hasLicenseChanged
    } 
    catch(error) {
      console.error("Operación cancelada o falló", error);
    }
  }

  async selectLicenseIndividual(license: License,userId,rotation = false) {
    try {      
      await this.licenseService.assignLicense(license,[userId],rotation);
      this.hasLicenseChanged = -this.hasLicenseChanged
    } 
    catch(error) {
      console.error("Operación cancelada o falló", error);
    }
  }

  async removeLicense() {
    if(this.selectedUsersIds.length > this.availableRotations){
      Swal.fire({
        icon: "info",
        title: "Rotaciones Insuficientes",
        text: "No hay suficientes rotaciones para reasignar licencias a todos los usuarios. ¿Desea continuar o contactar con ventas?",
        showDenyButton: true,
        showCancelButton: true,
        cancelButtonText:'Cancelar',
        confirmButtonText: "Aceptar",        
        denyButtonText: `Contactar con ventas`,
        denyButtonColor:'var(--gray-5)',
        confirmButtonColor: 'var(--blue-5)',
        cancelButtonColor:'var(--gray-4)'
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.waiting = true
          try {
            await this.licenseService.removeLicense(this.selectedUsersIds,this.licenses)
            this.hasLicenseChanged = -this.hasLicenseChanged
            this.waiting = false
          } 
          catch (error) {
            this.waiting = false
            console.error("Operación cancelada o falló", error);
          }        
        } else if (result.isDenied) {
          this.showDialog(this.licenses)
          this.waiting = false
        }
      });
      return
    }
    else{
      this.waiting = true
      try {
        await this.licenseService.removeLicense(this.selectedUsersIds,this.licenses)
        this.hasLicenseChanged = -this.hasLicenseChanged
        this.waiting = false
      } 
      catch (error) {
        console.error("Operación cancelada o falló", error);
      }  
    }

  }

  waiting = false

  async assignLicense(){
    this.waiting = true
    let today = new Date().getTime()
    let licencia
    let rotation = false
    if(this.selectedUsersIds.length>this.availableLicenses){
      Swal.fire({
        icon: "info",
        title: "Licencias Insuficientes",
        text: "No hay suficientes licencias disponibles para todos los usuarios seleccionados.",
        confirmButtonText: "Contactar con ventas",
        showCancelButton: true,
        confirmButtonColor: 'var(--blue-5)',
        cancelButtonText:'Cancelar',
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.showDialog(this.licenses)
        }
      });
      this.waiting = false
      return
    }

    const dialogResult = await firstValueFrom(this.dialogService.dialogConfirmar().afterClosed());
    if (dialogResult) {
      for (let userSelected of this.selectedUsersIds) {
        try{
          if(this.rotationsWaitingCount>0 && this.availableRotations>0){
            // licencia = this.licenses.filter(license=> ((license.quantity>license.quantityUsed ) && (license.status == 'active') && (license.rotations>license.rotationsUsed) && (license.currentPeriodEnd>=today) && (license.rotationsWaitingCount>0))).sort((a, b) => a.currentPeriodStart - b.currentPeriodStart)
            licencia = this.licenses.filter(license=> (license.quantity>license.quantityUsed && license.status == 'active') && (license.currentPeriodEnd>=today) && license.rotationsWaitingCount >0  ).sort((a, b) => a.currentPeriodStart - b.currentPeriodStart)
            console.log('rotar',licencia,this.licenses)
            rotation = true
          }
          else{
            licencia = this.licenses.filter(license=> (license.quantity>license.quantityUsed && license.status == 'active') && (license.currentPeriodEnd>=today) ).sort((a, b) => a.currentPeriodStart - b.currentPeriodStart)
          }
          let LicenciaUsar;
          console.log('licencia',licencia,this.licenses)
          if (licencia.length>0){
            LicenciaUsar = licencia[0]
            console.log('LicenciaUsar',LicenciaUsar)
            await this.selectLicenseIndividual(LicenciaUsar,userSelected,rotation)
          }
          else{
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "No hay licencias disponibles",
            });
          }
        }
        catch{
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Error asignando licencias",
          });
        }
      }
      this.dialogService.dialogExito()
      this.waiting = false
    }
    else{
      this.waiting = false
    }
  }

  showDialog(licenses: License[]) {
    this.dialog.open(DialogRequestLicensesComponent, {
      data: {
        licenses
      }
    })
  }
  showDialog2(licenses: License[]) {
    this.dialog.open(DialogHistoryLicensesComponent, {
      data: {
        licenses
      }
    })
  }


  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
      this.licensesSubscription.unsubscribe()
    }
  }
}
