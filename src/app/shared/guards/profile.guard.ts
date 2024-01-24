import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ProfileService } from '../services/profile.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileGuard {
  constructor(private profileService: ProfileService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const id = route.paramMap.get('id');
    if (id === 'new') {
      return true;
    } else {
      return this.checkIdInDatabase(id);
    }
  }

  private checkIdInDatabase(id: string): Observable<boolean> {
    return this.profileService.getProfile$(id).pipe(map(profile => {
        console.log("profile", profile)
        if (profile) return true
        this.router.navigate(['']);
        return false
    }))
  }
}