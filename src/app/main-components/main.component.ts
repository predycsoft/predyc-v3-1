import { Component } from '@angular/core';
import { EnterpriseService } from '../shared/services/enterprise.service';
import { UserService } from '../shared/services/user.service';
import { IconService } from '../shared/services/icon.service';
import { User } from '../shared/models/user.model';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private authService: AuthService,
    public icon: IconService
  ) {}

  user: User
  user$: Observable<User> = this.authService.user$
  menuExpanded = true

  ngOnInit() {}
}
