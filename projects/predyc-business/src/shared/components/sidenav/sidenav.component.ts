import { Component, Input, SimpleChanges } from "@angular/core";
import { onSideNavChange, animateText } from "../../animations/animations";
import { AuthService } from "../../services/auth.service";
import { IconService } from "../../services/icon.service";
import { User } from "projects/shared/models/user.model";
import { Observable } from "rxjs";

interface Page {
  link: string;
  name: string;
  icon: string;
  queryParams?: { [key: string]: any }; // Hacer queryParams opcional
}

@Component({
  selector: "app-sidenav",
  templateUrl: "./sidenav.component.html",
  styleUrls: ["./sidenav.component.css"],
  animations: [onSideNavChange, animateText],
})
export class SideNavComponent {
  user: User;
  user$: Observable<User> = this.authService.user$;

  public linkText: boolean = false;

  public pages: Page[] = [];

  public businessPages: Page[] = [
    {
      name: "Dashboard",
      link: "",
      icon: "../../assets/iconsUI/dashboard-1.svg",
    },
    {
      name: "Estudiantes",
      link: "management/students",
      queryParams: { status: "active" },
      icon: "../../assets/iconsUI/management-1.svg",
    },
    {
      name: "Perfiles",
      link: "management/profiles",
      icon: "../../assets/iconsUI/task--add.svg",
    },
    {
      name: "Cursos",
      link: "management/courses",
      icon: "../../assets/iconsUI/courses-1.svg",
    },
    {
      name: "Licencias",
      link: "settings",
      icon: "../../assets/iconsUI/settings-1.svg",
    },
    {
      name: "Diagnóstico",
      link: "management/certifications",
      icon: "../../assets/iconsUI/certificate.svg",
    },
  ];

  public adminPages: Page[] = [
    // {
    //   name: "Principal",
    //   link: "/admin",
    //   icon: "../../assets/iconsUI/home.svg",
    // },
    {
      name: "Estudiantes",
      link: "/admin/students",
      icon: "../../assets/iconsUI/management-1.svg",
    },
    {
      name: "Empresas",
      link: "/admin/enterprises",
      icon: "../../assets/iconsUI/enterprise.svg",
    },
    {
      name: "Productos",
      link: "/admin/products",
      icon: "../../assets/iconsUI/bookmark.svg",
    },
    // {
    // 	name: "L&S",
    // 	link: "/admin/licenses-and-subscriptions",
    // 	icon: "../../assets/iconsUI/Vector.svg",
    // },
    {
      name: "Instructores",
      link: "/admin/instructors",
      icon: "../../assets/iconsUI/suitcase.svg",
    },
    {
      name: "Ventas",
      link: "/admin/sales",
      icon: "../../assets/iconsUI/catalog.svg",
    },
    {
      name: "Cursos",
      link: "/admin/courses",
      icon: "../../assets/iconsUI/courses-1.svg",
    },
    {
      name: "Cursos en vivo",
      link: "/admin/live",
      icon: "../../assets/iconsUI/demo.svg",
    },
    {
      name: "Freebies",
      link: "/admin/freebies",
      icon: "../../assets/iconsUI/puzzle.svg",
    },
    {
      name: "Preguntas",
      link: "/admin/questions",
      icon: "../../assets/iconsUI/help.svg",
    },
    {
      name: "Diplomados",
      link: "/admin/diplomados",
      icon: "../../assets/iconsUI/education.svg",
    },
    {
      name: "Certificaciones",
      link: "/admin/certifications",
      icon: "../../assets/iconsUI/certificate.svg",
    },
    {
      name: "Artículos",
      link: "/admin/articles",
      icon: "../../assets/iconsUI/bookmark.svg",
    },
  ];

  constructor(public icon: IconService, private authService: AuthService) {}

  @Input() menuExpanded = false;
  @Input() currentUrl: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.currentUrl) {
      this.pages = this.currentUrl.startsWith("/admin") ? this.adminPages : this.businessPages;
    }
  }
}
