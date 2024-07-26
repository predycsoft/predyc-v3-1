import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-floating-notification',
  templateUrl: './floating-notification.component.html',
  styleUrls: ['./floating-notification.component.css']
})
export class FloatingNotificationComponent {
  @Input() message: string;
  
}