import { Component, Input } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-frequent-questions',
  templateUrl: './frequent-questions.component.html',
  styleUrls: ['./frequent-questions.component.css']
})
export class FrequentQuestionsComponent {

  @Input() questions: string[]

  constructor(
    public icon:IconService,
  ){}

  public panelOpenStates: boolean[] = [];

  ngOnInit() {
    this.panelOpenStates = Array(this.questions.length).fill(false);
  }
  

}
