import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-general-selector',
  templateUrl: './general-selector.component.html',
  styleUrls: ['./general-selector.component.css']
})
export class GeneralSelectorComponent {
  @Input() origin: string = '';
  @Input() canpo: string = 'status';
  @Input() options: { value: string, label: string }[] = [];

  selectedStatus: string = '';
  private queryParamsSubscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public icon: IconService
  ) {}

  ngOnInit() {
    let defaultStatus = 'all';

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const status = params['canpo'] || defaultStatus;
      this.selectedStatus = status;
    });
  }

  onProfileSelectedChange() {
    this.updateQueryParams();
  }

  updateQueryParams() {
    this.router.navigate([], {
      queryParams: { [this.canpo]: this.selectedStatus ? this.selectedStatus : null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.queryParamsSubscription.unsubscribe();
  }
}
