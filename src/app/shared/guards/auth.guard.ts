import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isLoggedIn$.pipe(
        map(isLoggedIn => {
            // const isRoot = this.router.url === '/';
            const isRoot = false;
            if (isLoggedIn && isRoot) {
                // this.router.navigate(['dashboard']);
                return false;
            } else if (!isLoggedIn && !isRoot) {
                // this.router.navigate(['']);
                return false;
            }
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