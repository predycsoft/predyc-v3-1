import { Component } from '@angular/core';
import { onMainContentChange } from './shared/animations/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ onMainContentChange ]
})
export class AppComponent{

  userSignedIn = true;

  constructor() {}

}
