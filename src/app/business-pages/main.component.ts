import { Component } from '@angular/core';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { UserService } from 'src/shared/services/user.service';
import { IconService } from 'src/shared/services/icon.service';
import { User } from 'src/shared/models/user.model';
import { Observable, Subscription, filter } from 'rxjs';
import { AuthService } from 'src/shared/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportComponent } from 'src/shared/components/support/support.component';
import { License } from 'src/shared/models/license.model';
import { LicenseService } from 'src/shared/services/license.service';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(
    private authService: AuthService,
    public icon: IconService,
    private modalService: NgbModal,
    public licenseService: LicenseService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.url;
      // console.log("CurrentUrl" , this.currentUrl)
      this.isAdminPage =  this.currentUrl.startsWith("/admin")
    });
  }

  currentUrl: string;
  isAdminPage: boolean

  user: User
  user$: Observable<User> = this.authService.user$
  menuExpanded = false

  licensesSubscription: Subscription
  daysToExpire: number

  ngOnInit() {
    this.licensesSubscription = this.licenseService.getCurrentEnterpriseLicenses$().subscribe(licenses => {
      const now = Date.now()
      if (licenses && licenses.length > 0) {
        const validLicenses = licenses.filter(license => {
          return license.status === 'active'
        }).sort((a, b) => b.currentPeriodEnd - a.currentPeriodEnd)
        const lastLicense = validLicenses.length > 0 ? validLicenses[0] : null
        if (lastLicense) {
          // Calculate the difference in milliseconds
          const differenceInMilliseconds = Math.abs(now - lastLicense.currentPeriodEnd);

          // Convert milliseconds to days
          const millisecondsInDay = 1000 * 60 * 60 * 24;
          this.daysToExpire = Math.floor(differenceInMilliseconds / millisecondsInDay);
        }
      }
    });
  }

  openSupport() {
    this.modalService.open(SupportComponent, {
      animation: true,
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    })
  }

  redirect() {
    if (this.isAdminPage) {
      this.router.navigate([""])
    }
    else {
      this.router.navigate(["/admin"])
    }
  }
}
