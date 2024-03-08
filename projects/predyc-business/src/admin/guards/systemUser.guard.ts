import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { User } from 'projects/shared/models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class SystemUserGuard {

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.afAuth.authState.pipe(
        switchMap(user => {
            return  this.afs.collection<User>(User.collection).doc(user.uid).valueChanges().pipe(
                map(user => {
                    if (user?.isSystemUser) {
                        return true
                    } else {
                        this.router.navigate(['']);
                        return false
                    }
                })
            )
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
  //       else return of(null);  // If no user is logged in
  //     }),
  //     switchMap(userDoc => {
  //       return userDoc.pipe(
  //         map(user => { 
  //           if (user && !user.adminPredyc) {  // logged user is from business
  //             this.router.navigate(['']); // doesnt allow business user to go to admin predyc
  //             return true;
  //           } 
  //           else if (user && user.adminPredyc) { // logged user is adminPredyc
  //             const isLoginPath = state.url === '/login';
  //             if (isLoginPath) {
  //               this.router.navigate(['admin']);
  //               return false
  //             } 
  //             else return true // allows to visit the admin url.
  //           }
  //           else { // no logged user
  //             this.router.navigate(['/login']);
  //             return false;
  //           }
  //         })
  //       );
  //     })
  //   );
  // }

}
