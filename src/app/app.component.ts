import { Component } from '@angular/core';
import { onMainContentChange } from './shared/animations/animations';
import { LoaderService } from './shared/services/loader.service';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ onMainContentChange ]
})
export class AppComponent{

  constructor(
    public loaderService: LoaderService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.authService.subscribeToAuthState()
  }

}
