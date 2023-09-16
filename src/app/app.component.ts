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
    private authService: AuthService,
  ) {}

  ngOnInit() {
    setTimeout(() => {console.log(this.router.url)}, 1)
    // this.authService.user$.subscribe(user => {
    //   setTimeout(() => {console.log(this.router.url)}, 1)
    //   console.log(this.router)
    //   console.log(this.router.url)
    //   const testBool = this.router.url === '/'
    //   console.log(testBool)
    //   const replaceThisWithUser = true
    //   if (replaceThisWithUser && this.router.url === '/') {
    //     console.log("Caigo aqui?")
    //     // this.router.navigate(['dashboard']);
    //   } else if (!replaceThisWithUser) {
    //     // this.router.navigate(['']);
    //   }
    // });

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
