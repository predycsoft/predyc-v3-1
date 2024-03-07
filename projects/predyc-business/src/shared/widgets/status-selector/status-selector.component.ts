import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-status-selector',
  templateUrl: './status-selector.component.html',
  styleUrls: ['./status-selector.component.css']
})
export class StatusSelectorComponent {

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public icon: IconService,
  ) {}

  selectedStatus: string = ''
  private queryParamsSubscription: Subscription

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const status = params['status'] || 'inactive';
      this.selectedStatus = status
    })
  }

  onProfileSelectedChange() {
    this.updateQueryParams()
  }

  updateQueryParams() {
    this.router.navigate([], {
      queryParams: { status: this.selectedStatus ? this.selectedStatus : null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.queryParamsSubscription.unsubscribe()
  }

}

