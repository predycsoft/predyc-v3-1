import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  
  constructor() { }
  loading = 0

  setLoading(value: boolean) {
    if (value) {
        this.loading++;
    } else {
        this.loading--;
    }
}


}
