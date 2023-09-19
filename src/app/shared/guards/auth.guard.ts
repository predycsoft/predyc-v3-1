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

}
