import { Component, Input } from '@angular/core';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-support-contact',
  templateUrl: './support-contact.component.html',
  styleUrls: ['./support-contact.component.css']
})
export class SupportContactComponent {
  @Input() mode: string
  constructor(
    private userService: UserService,
    public icon:IconService,

  ){}

  // Crear modelo para este objeto de opciones 
  object = {
    sales: "salesManagerRef",
    account: "accountManagerRef"
  }
  
  manager

  async ngOnInit() {
    this.userService.usersLoaded$.subscribe(async isLoaded => {
      if (isLoaded) {
        this.manager = await this.userService.getGeneralUserData(this.object[this.mode])
      }
    })
  }
  
}
