import { Component } from '@angular/core';
import { onMainContentChange } from 'projects/predyc-business/src/shared/animations/animations';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ onMainContentChange ]
})
export class AppComponent{

  constructor(
    public loaderService: LoaderService,
    private router: Router,
    private authService: AuthService,
    private metaService: Meta
  ) {
    this.authService.subscribeToAuthState()
  }
  
  defaultMetaTags = [
    { name: 'description', content: 'Descripción global de predyc business' },
    { name: 'keywords', content: 'predyc, business' },
    { name: 'author', content: 'Predyc' },
  ];

  ngOnInit() {
    // Global metatags
    // this.metaService.addTags(this.defaultMetaTags);

    // this.router.events.pipe(
    //   filter(event => event instanceof NavigationEnd)
    // ).subscribe(() => {
    //   this.updateMetaTags();
    // });
  }

  updateMetaTags() {
    const currentRoute = this.router.routerState.snapshot.root;

    // Check if current route or its children have meta tags set
    if (!this.hasCustomMetaTags(currentRoute)) {
      // Reapply default meta tags if no custom meta tags are set
      this.metaService.updateTag(this.defaultMetaTags[0]);
      this.metaService.updateTag(this.defaultMetaTags[1]);
      this.metaService.updateTag(this.defaultMetaTags[2]);
    }
  }

  hasCustomMetaTags(route) {
    if (route.data && route.data.metaTags) return true;
    if (route.firstChild) return this.hasCustomMetaTags(route.firstChild);
    return false;
  }

}
