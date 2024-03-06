import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-licenses-subscriptions',
  templateUrl: './licenses-subscriptions.component.html',
  styleUrls: ['./licenses-subscriptions.component.css']
})
export class LicensesSubscriptionsComponent {
  constructor(
    public icon: IconService,
  ) {}
}
