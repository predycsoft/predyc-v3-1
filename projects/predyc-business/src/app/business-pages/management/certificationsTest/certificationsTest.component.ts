import { Component } from '@angular/core';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';

@Component({
  selector: 'app-certifications-test',
  templateUrl: './certificationsTest.component.html',
  styleUrls: ['./certificationsTest.component.css']
})
export class CertificationsTestComponent {


  constructor(
    private activityClassesService:ActivityClassesService,
  ){

  }

  certificationId
  makeChart = 0

  ngOnInit(): void {
    this.certificationId = 'C7Y7qcApOxsLPhsCWVYb'


  }

  ngAfterViewInit(){
    setTimeout(() => {
      this.makeChart=this.makeChart+1
    }, 500);
  }


}
