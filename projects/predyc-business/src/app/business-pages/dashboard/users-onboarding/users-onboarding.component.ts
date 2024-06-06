import {Component, Input, SimpleChanges } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-users-onboarding',
  templateUrl: './users-onboarding.component.html',
  styleUrls: ['./users-onboarding.component.css']
})
export class UsersOnboardingComponent {

  ctx : any;
  config : any;
  chartData : number[] = [];
  chartDatalabels : string[] = [];

  constructor(
    public icon: IconService,


  ){}
  @Input() users

  

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {


  }



}
