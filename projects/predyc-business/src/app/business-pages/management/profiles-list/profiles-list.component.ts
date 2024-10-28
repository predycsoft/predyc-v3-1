import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { Profile } from 'projects/shared/models/profile.model';
import { User } from 'projects/shared/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-profiles-list',
  templateUrl: './profiles-list.component.html',
  styleUrls: ['./profiles-list.component.css'],
})
export class ProfilesListComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private modalService: NgbModal,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
    private _snackBar: MatSnackBar,

  ){}

  profiles: Profile[] = []
  profilesPredyc: Profile[] = []
  selectedProfile: string
  private profileSubscription: Subscription
  private queryParamsSubscription: Subscription

  filter = false

  ngOnInit() {

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      this.filter = false; // Inicializar filter en false

      // Verificar si params tiene alguna clave y si no es solo 'page' con valor 1
      const keys = Object.keys(params);
      if (keys.length > 0) {
        // Excluir el caso donde solo hay 'page' con valor 1
        if (!(keys.length === 1 && keys[0] === 'page' && params['page'] === '1')) {
          this.filter = true;
        }
      }

    })

  }

  removeAllFilter(){
    this.router.navigate(["/management/profiles"])
  }

}
