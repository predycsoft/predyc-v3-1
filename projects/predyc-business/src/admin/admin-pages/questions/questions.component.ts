import { Component } from '@angular/core';

@Component({
  selector: 'app-questions-courses',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent {

  totalAnswered: number = 0;
  totalPending: number = 0;

  updateTotals(totals: {answered: number, pending: number}) {
    this.totalAnswered = totals.answered;
    this.totalPending = totals.pending;
  }

}
