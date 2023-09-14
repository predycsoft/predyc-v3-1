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
  loading = false
  visitedRoutes: Set<string> = new Set<string>();


  constructor(
    private loaderService: LoaderService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.router.navigate(['dashboard'])

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

    // CODIGO DEL LOADER COMENTADO MOMENTANEAMENTE
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationStart) {
    //     if (this.visitedRoutes.has(event.url)) {
    //       console.log(`Ya has visitado la ruta: ${event.url}`);
    //     } else {
    //       this.visitedRoutes.add(event.url);
    //       this.loading = true; // Muestra el spinner al empezar la navegación
    //     }
    //   }
    //   // if (event instanceof NavigationEnd || event instanceof NavigationError || event instanceof NavigationCancel) {
    //   //   // this.loading = false; // Oculta el spinner al terminar la navegación
    //   // }
    // })
    // this.loaderService.loading$.subscribe(loading => {
    //   this.loading = loading;
    // });
      
  }


}
