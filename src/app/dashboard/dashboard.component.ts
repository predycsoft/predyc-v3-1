import { Component } from '@angular/core';
import { SidenavService } from '../services/sidenav.service';
import { onMainContentChange } from '../animations/animations';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [ onMainContentChange ]
})
export class DashboardComponent {

  public onSideNavChange: boolean = false;

  constructor(private _sidenavService: SidenavService) {
    this._sidenavService.sideNavState$.subscribe( res => {
      console.log(res)
      this.onSideNavChange = res;
    })
  }

}
