import { Component } from '@angular/core';
import { onMainContentChange } from 'projects/predyc-business/src/shared/animations/animations';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ onMainContentChange ]
})
export class AppComponent{

  constructor(
    public loaderService: LoaderService,
    private authService: AuthService,
  ) {
    this.authService.subscribeToAuthState()
  }
  

}
