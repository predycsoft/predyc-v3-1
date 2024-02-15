import { Component, Input } from '@angular/core';
import { onSideNavChange, animateText } from '../../animations/animations'
import { AuthService } from '../../services/auth.service';
import { IconService } from '../../services/icon.service';
import { SidenavService } from '../../services/sidenav.service';
import { User } from '../../models/user.model';
import { Observable, firstValueFrom } from 'rxjs';

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

  public pages: Page[] = [
    {name: 'Dashboard', link:'', icon: '../../assets/iconsUI/dashboard-1.svg'},
    {name: 'Estudiantes', link:'management/students', icon: '../../assets/iconsUI/management-1.svg'},
    {name: 'Cursos', link:'management/courses', icon: '../../assets/iconsUI/courses-1.svg'},
    // {name: 'Validación', link:'validation', icon: '../../assets/iconsUI/sidenav_fact_check.svg'},
    // {name: 'Notificaciones', link:'management/notifications', icon: '../../assets/iconsUI/notification.svg'},
    {name: 'Licencias', link:'settings', icon: '../../assets/iconsUI/settings-1.svg'},
  ]

  constructor(
    public icon: IconService,
    private authService: AuthService
  ) {}

  @Input() menuExpanded = false
  
  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user?.adminPredyc) this.pages.push({
        name: 'Crear demo',
        link:'management/create-demo',
        icon: '../../assets/iconsUI/credentials.svg'
      })
    })
  }

}
