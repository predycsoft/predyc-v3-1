import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authService: AuthService, private router: Router, private afAuth: AngularFireAuth) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.afAuth.authState.pipe(
        map(user => {
            const isLoginPath = state.url === '/login';
            if (user && isLoginPath) {
                this.router.navigate(['']);
                return false;
            } else if (!user && !isLoginPath) {
                this.router.navigate(['login']);
                return false;
            }
            return true;
        })
    )
  }

  // canActivate(
  //   next: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot
  // ): Observable<boolean> {
  //   return this.afAuth.authState.pipe(
  //     map(user => {
  //       if (user) { return this.afs.collection<User>(User.collection).doc(user.uid).valueChanges(); } 
  //       else return of(null); // If no user is logged in
  //     }),
  //     switchMap(userDoc => {
  //       return userDoc.pipe(
  //         map(user => { 
  //           const isLoginPath = state.url === '/login';
  //           if (user && !user.adminPredyc) { // logged user is from business
  //             if (isLoginPath) {
  //               this.router.navigate(['']);
  //               return false;
  //             } 
  //             else return true;
  //           } 
  //           else if (user && user.adminPredyc) { // logged user is adminPredyc
  //             if (isLoginPath) {
  //               this.router.navigate(['admin']);
  //               return false
  //             } 
  //             else return true  // Allow admin predyc users to visit business
  //           }
  //           else { // No logged user
  //             if (isLoginPath) return true 
  //             else {
  //               this.router.navigate(['/login']); 
  //               return false;
  //             }
  //           }
  //         })
  //       );
  //     })
  //   );
  // }

}
