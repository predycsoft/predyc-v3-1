import { Component, Input, SimpleChanges } from '@angular/core';
import { onSideNavChange, animateText } from '../../animations/animations'
import { AuthService } from '../../services/auth.service';
import { IconService } from '../../services/icon.service';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';

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

  user: User
  user$: Observable<User> = this.authService.user$

  public linkText: boolean = false;

  public pages: Page[] = []

  public businessPages: Page[] = [
    {name: 'Dashboard', link:'', icon: '../../assets/iconsUI/dashboard-1.svg'},
    {name: 'Estudiantes', link:'management/students', icon: '../../assets/iconsUI/management-1.svg'},
    {name: 'Cursos', link:'management/courses', icon: '../../assets/iconsUI/courses-1.svg'},
    {name: 'Licencias', link:'settings', icon: '../../assets/iconsUI/settings-1.svg'},
  ]

  public adminPages: Page[] = [
    {name: 'page1', link:'/admin', icon: '../../assets/iconsUI/home.svg'},
    {name: 'Crear demo', link:'/admin/create-demo', icon: '../../assets/iconsUI/demo.svg'}
    // {name: 'page3', link:'/admin', icon: '../../assets/iconsUI/settings-1.svg'},
  ]



  constructor(
    public icon: IconService,
    private authService: AuthService,
  ) {
  }

  @Input() menuExpanded = false
  @Input() currentUrl: string

  ngOnChanges(changes: SimpleChanges) {
    if (changes.currentUrl) {
      this.pages = this.currentUrl.startsWith("/admin") ? this.adminPages : this.businessPages;
    }
  }
}