import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators';

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
      switchMap(user => {
        const isLoginPath = state.url === '/login';
        if (user && isLoginPath) {
          this.router.navigate(['']);
          return of(false);
        } else if (!user && !isLoginPath) {
          this.router.navigate(['login']);
          return of(false);
        } else if (user) {
          return from(this.authService.waitForUser()).pipe(
            map(userInfo => {
              console.log('Firebase Auth User:', user);
              console.log('User Information from AuthService:', userInfo);
              if (userInfo && userInfo.role === 'instructor' && state.url === '/') {
                this.router.navigate(['/instructor']);
                return false;
              }
              return true;
            })
          );
        } else {
          return of(true);
        }
      })
    );
  }
}
