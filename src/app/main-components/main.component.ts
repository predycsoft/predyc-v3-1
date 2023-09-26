import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from '../shared/decorators/loading.decorator';
import { EnterpriseService } from '../shared/services/enterprise.service';
import { LoaderService } from '../shared/services/loader.service';
import { UserService } from '../shared/services/user.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    this.enterpriseService.loadEnterpriseData()
    await this.userService.loadUsers()
    await this.userService.whenUsersLoaded()
    // await this.userService.loadUsers()
    // await this.userService.whenUsersLoaded()
  }
}
