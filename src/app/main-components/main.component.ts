import { Component } from '@angular/core';
import { EnterpriseService } from '../shared/services/enterprise.service';
import { UserService } from '../shared/services/user.service';
import { IconService } from '../shared/services/icon.service';
import { User } from '../shared/models/user.model';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportComponent } from '../shared/components/support/support.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(
    private authService: AuthService,
    public icon: IconService,
    private modalService: NgbModal,
  ) {}

  user: User
  user$: Observable<User> = this.authService.user$
  menuExpanded = false

  ngOnInit() {}

  openSupport() {
    this.modalService.open(SupportComponent, {
      animation: true,
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    })
  }
}
