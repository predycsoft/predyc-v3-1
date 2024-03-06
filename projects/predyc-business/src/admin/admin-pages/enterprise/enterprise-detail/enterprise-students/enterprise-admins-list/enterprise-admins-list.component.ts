import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

@Component({
  selector: 'app-enterprise-admins-list',
  templateUrl: './enterprise-admins-list.component.html',
  styleUrls: ['./enterprise-admins-list.component.css']
})
export class EnterpriseAdminsListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private userService: UserService,
    public dialogService: DialogService,
  ){}


  displayedColumns: string[] = [
    "displayName",
    "email",
    "delete",
  ];

  dataSource = new MatTableDataSource<User>();

  userSubscription: Subscription

  addingAdmin: boolean = false;
  newAdmin: User

  ngOnInit() {
    this.userSubscription = this.userService.getAdminUsersByEnterpriseRef$(this.enterpriseRef).subscribe(adminUsers => {
      this.dataSource.data = adminUsers
    })
  }


  async addAdmin() {
    this.addingAdmin = true
    this.newAdmin = User.getEnterpriseAdminUser(this.enterpriseRef)
  }
  
  async saveAdmin() {
    // console.log("newAdmin", this.newAdmin)
    this.newAdmin.displayName = this.newAdmin.name
    this.addingAdmin = false
    try {
      await this.userService.addUser(this.newAdmin)
      this.dialogService.dialogExito();
    } catch (error) {
      this.dialogService.dialogAlerta("Hubo un error al guardar el nuevo administrador. Inténtalo de nuevo.");
    }

  }

  deleteAdmin(user: User){

  }



  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe()
  }


}
