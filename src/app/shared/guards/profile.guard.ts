import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { EnterpriseService } from '../services/enterprise.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileGuard {
  constructor(private enterpriseService: EnterpriseService, private profileService: ProfileService, private router: Router) {}

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
        const enterpriseRef = this.enterpriseService.getEnterpriseRef()
        if(profile.enterpriseRef?.id == enterpriseRef.id || !profile?.enterpriseRef)  return true
        //if (profile && [null, enterpriseRef].includes(profile.enterpriseRef)) return true
        this.router.navigate(['']);
        return false
    }))
  }
}