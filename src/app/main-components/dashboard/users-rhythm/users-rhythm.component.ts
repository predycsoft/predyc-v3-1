import { Component, Input } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-users-rhythm',
  templateUrl: './users-rhythm.component.html',
  styleUrls: ['./users-rhythm.component.css']
})
export class UsersRhythmComponent {

  constructor(
    public icon: IconService,

  ){}
  @Input() high: number
  @Input() medium: number
  @Input() low: number
  @Input() noPlan: number

  highPercentage
  mediumPercentage
  lowPercentage
  noPlanPercentage

  goodRhythmPercentage
  

  ngOnInit() {
    const total = this.high + this.medium + this.low + this.noPlan
    this.highPercentage = total ? this.getPercentage(this.high, total) : 0
    this.mediumPercentage = total ? this.getPercentage(this.medium, total) : 0
    this.lowPercentage = total ? this.getPercentage(this.low, total) : 0
    this.noPlanPercentage = total ? this.getPercentage(this.noPlan, total) : 0
    this.goodRhythmPercentage = total ? this.getPercentage((this.high + this.medium), total) : 0
  }

  getPercentage(value: number, total: number) {
    return value * 100 / total
  }
}
