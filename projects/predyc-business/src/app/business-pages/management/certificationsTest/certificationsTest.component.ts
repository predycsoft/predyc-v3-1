import { Component } from '@angular/core';

@Component({
  selector: 'app-certifications-test',
  templateUrl: './certificationsTest.component.html',
  styleUrls: ['./certificationsTest.component.css']
})
export class CertificationsTestComponent {

  certificationId
  makeChart = 0

  ngOnInit(): void {
    this.certificationId = 'C7Y7qcApOxsLPhsCWVYb'
  }

  ngAfterViewInit(){

    setTimeout(() => {
      this.makeChart=this.makeChart+1
    }, 300);
  }


}
