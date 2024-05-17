import { Component } from '@angular/core';
import { ChatgptService } from 'projects/predyc-business/src/shared/services/chatgpt.service';

@Component({
  selector: 'app-questions-courses',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent {

  constructor(
    private chatgptService: ChatgptService
  ) {}

  isAIChatActive: boolean
  totalAnswered: number = 0;
  totalPending: number = 0;

  ngOnInit() {
    this.chatgptService.getChatFeatureAllowence$().subscribe(showChat => {
      this.isAIChatActive = showChat
    })
  }

  updateTotals(totals: {answered: number, pending: number}) {
    this.totalAnswered = totals.answered;
    this.totalPending = totals.pending;
  }
  
  async onClick(toActive: boolean) {
    await this.chatgptService.setAllowAIChatFeature(toActive)
    console.log("set to: ", toActive)
  }

}
