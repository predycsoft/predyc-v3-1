import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.user$.pipe(
        map(user => {
            const isLoginPath = state.url === '/login';
            console.log(`User is logged in: ${user}`)
            console.log(`Path going ${state.url}`)
            if (true && isLoginPath) {
                this.router.navigate(['']);
                console.log("Should go to dashboard")
                return false;
            } else if (!true && !isLoginPath) {
                this.router.navigate(['login']);
                console.log("Should go to login")
                return false;
            }
            console.log("Can navigate no problem")
            return true;
        })
    )
  }
    // canActivate() {
    //     console.log("PEPE")
    //     return true
    //     // const isRoot = this.router.url === '/';
    //     // if (isLoggedIn && isRoot) {
    //     //     this.router.navigate(['dashboard']);
    //     //     return false;
    //     // } else if (!isLoggedIn && !isRoot) {
    //     //     this.router.navigate(['']);
    //     //     return false;
    //     // }
    //     // return true;
    // }
}

// map(user => {
//     const isRoot = this.router.url === '/';

//     if (user && isRoot) {
//       this.router.navigate(['dashboard']);
//       return false;
//     } else if (!user && !isRoot) {
//       this.router.navigate(['']);
//       return false;
//     }
//     return true;
//   })