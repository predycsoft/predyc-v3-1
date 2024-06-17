import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Profile } from 'projects/shared/models/profile.model';
import { ProfileService } from '../../services/profile.service';
import { IconService } from '../../services/icon.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'shared';

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
  @Input() enterpriseRef: DocumentReference<Enterprise>


  ngOnInit() {

    // console.log('perfil reviar',this.profiles)
    this.profileService.loadProfiles()

    if(this.enterpriseRef){

      this.profileService.getProfiles$(this.enterpriseRef).subscribe(profiles => {
        if (profiles){
          profiles = profiles.filter(x=>x.enterpriseRef)
          this.profiles = profiles
        }
      })
    }
    else{

      this.profileService.getProfiles$().subscribe(profiles => {
        if (profiles){
          profiles = profiles.filter(x=>x.enterpriseRef)
          this.profiles = profiles
        }
      })

    }

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
