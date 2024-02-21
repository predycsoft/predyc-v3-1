import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { SupportComponent } from 'src/shared/components/support/support.component';
import { User } from 'src/shared/models/user.model';
import { AuthService } from 'src/shared/services/auth.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-main-admin',
  templateUrl: './main-admin.component.html',
  styleUrls: ['./main-admin.component.css']
})
export class MainAdminComponent {

  menuExpanded = false
  
  constructor(
    public icon: IconService,
    private modalService: NgbModal,
    private authService: AuthService,
    
  ){}
    
  user$: Observable<User> = this.authService.user$

  openSupport() {
    this.modalService.open(SupportComponent, {
      animation: true,
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    })
  }

  signOut() {
    this.authService.signOut();
  }

}
