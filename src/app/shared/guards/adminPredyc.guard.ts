import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AdminPredycGuard {

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.afAuth.authState.pipe(
        switchMap(user => {
            return  this.afs.collection<User>(User.collection).doc(user.uid).valueChanges().pipe(
                map(user => {
                    if (user?.adminPredyc) {
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

}
