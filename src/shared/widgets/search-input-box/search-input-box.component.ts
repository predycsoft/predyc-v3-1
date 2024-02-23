import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-search-input-box',
  templateUrl: './search-input-box.component.html',
  styleUrls: ['./search-input-box.component.css']
})
export class SearchInputBoxComponent {

  public inputText: string
  private queryParamsSubscription: Subscription
  private searchTerm = new Subject<string>();

  DEBOUNCE_TIME: number = 300

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public icon: IconService
  ) {}

  ngOnInit() {
    // this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
    //   const searchTerm = params['search'] || '';
    //   this.inputText = searchTerm;
    // })
    this.inputText = this.activatedRoute.snapshot.queryParams['search'] || ''
    this.searchTerm.pipe(
      debounceTime(this.DEBOUNCE_TIME)
    ).subscribe(term => {
      this.router.navigate([], {
        queryParams: { search: term ? term : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    })
  }

  search() {
    this.searchTerm.next(this.inputText.toLowerCase());
  }

  ngOnDestroy() {
    this.searchTerm.unsubscribe()
    // this.queryParamsSubscription.unsubscribe()
  }

}
