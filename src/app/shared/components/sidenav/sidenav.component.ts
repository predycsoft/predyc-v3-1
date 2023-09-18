import { Component } from '@angular/core';
import { onSideNavChange, animateText } from '../../animations/animations'
import { AuthService } from '../../services/auth.service';
import { IconService } from '../../services/icon.service';
import { SidenavService } from '../../services/sidenav.service';

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

  public linkText: boolean = false;

  public pages: Page[] = [
    {name: 'Dashboard', link:'', icon: '../../assets/iconsUI/sidenav_app.svg'},
    {name: 'Gestión', link:'management', icon: '../../assets/iconsUI/sidenav_manage_accounts.svg'},
    {name: 'Cursos', link:'management/courses', icon: '../../assets/iconsUI/sidenav_collections_bookmark.svg'},
    {name: 'Validación', link:'validation', icon: '../../assets/iconsUI/sidenav_fact_check.svg'},
    {name: 'Config', link:'settings', icon: '../../assets/iconsUI/sidenav_config.svg'},
  ]

  constructor(
    public icon: IconService,
    private authService: AuthService
  ) {}

  signOut() {
    this.authService.signOut();
  }

}
