import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.css']
})
export class CertificationsComponent {

  constructor(
    public icon: IconService,
    private router: Router,
  ) {}


  newCertificate() {
    this.router.navigate(["/admin/certifications/form"])
  }

}
