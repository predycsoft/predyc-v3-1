import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { User } from 'src/shared/models/user.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { UserService } from 'src/shared/services/user.service';

@Component({
  selector: 'app-enterprise-admins-list',
  templateUrl: './enterprise-admins-list.component.html',
  styleUrls: ['./enterprise-admins-list.component.css']
})
export class EnterpriseAdminsListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
  ){}


  displayedColumns: string[] = [
    "displayName",
    "email",
    "delete",
  ];

  dataSource = new MatTableDataSource<User>();

  userSubscription: Subscription

  ngOnInit() {
    this.userSubscription = this.userService.getAdminUsersByEnterpriseRef$(this.enterpriseRef).subscribe(adminUsers => {
      console.log("adminUsers", adminUsers)
      this.dataSource.data = adminUsers
    })
  }


  async addAdmin() {

  }

  deleteAdmin(user: User){

  }

  onActive(user: User) {

  }


  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe()
  }


}
