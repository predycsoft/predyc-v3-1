import { Component } from '@angular/core';
import { onMainContentChange } from './shared/animations/animations';
import { LoaderService } from './shared/services/loader.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ onMainContentChange ]
})
export class AppComponent{

  userSignedIn: boolean = true;


  constructor(
    public loaderService: LoaderService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // ESTO ES LO QUE ESTOY TRABAJANDO
    // this.authService.user$.subscribe(user => {
    //   if (user) {
    //     this.userSignedIn = true
    //     this.router.navigate(['dashboard'])
    //   } else {
    //     this.userSignedIn = false
    //     this.router.navigate([''])
    //   }
    // })

      
  }


}
