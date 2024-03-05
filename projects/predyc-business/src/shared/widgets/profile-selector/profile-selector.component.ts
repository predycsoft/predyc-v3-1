import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Profile } from '../../models/profile.model';
import { ProfileService } from '../../services/profile.service';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-profile-selector',
  templateUrl: './profile-selector.component.html',
  styleUrls: ['./profile-selector.component.css']
})
export class ProfileSelectorComponent {

  constructor(
    private activatedRoute: ActivatedRoute,
    private profileService: ProfileService,
    private router: Router,
    public icon: IconService,
  ) {}

  profiles: Profile[] = []
  selectedProfile: string = ''
  private queryParamsSubscription: Subscription

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profileService.getProfiles$().subscribe(profiles => {if (profiles) this.profiles = profiles})
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const profile = params['profile'] || '';
      this.selectedProfile = profile
    })
  }

  onProfileSelectedChange() {
    this.updateQueryParams()
  }

  updateQueryParams() {
    this.router.navigate([], {
      queryParams: { profile: this.selectedProfile ? this.selectedProfile : null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.queryParamsSubscription.unsubscribe()
  }

}
