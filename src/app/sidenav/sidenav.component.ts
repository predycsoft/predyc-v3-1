import { Component } from '@angular/core';
import { onSideNavChange, animateText } from '../animations/animations'
import { IconService } from '../services/icon.service';
import { SidenavService } from '../services/sidenav.service';

interface Page {
  link: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css'],
  animations: [onSideNavChange, animateText]
})
export class SideNavComponent {

  public sideNavState: boolean = false;
  public linkText: boolean = false;

  public pages: Page[] = [
    {name: 'Dashboard', link:'dashboard', icon: '../../assets/iconsUI/sidenav_app.svg'},
    {name: 'Gestión', link:'gestion', icon: '../../assets/iconsUI/sidenav_manage_accounts.svg'},
    {name: 'Cursos', link:'cursos', icon: '../../assets/iconsUI/sidenav_collections_bookmark.svg'},
    {name: 'Validación', link:'validacion', icon: '../../assets/iconsUI/sidenav_fact_check.svg'},
    {name: 'Config', link:'configuracion', icon: '../../assets/iconsUI/sidenav_config.svg'},
  ]

  constructor(
    public icon: IconService,
    private _sidenavService: SidenavService
  ) {}

  ngOnInit() {
  }

  onSideNavToggle() {
    console.log("This is working")
    this.sideNavState = !this.sideNavState
    
    setTimeout(() => {
      this.linkText = this.sideNavState;
    }, 200)
    this._sidenavService.sideNavState$.next(this.sideNavState)
  }

}
