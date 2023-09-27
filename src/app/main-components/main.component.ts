import { Component } from '@angular/core';
import { EnterpriseService } from '../shared/services/enterprise.service';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
  ) {}

  ngOnInit() {}
}
