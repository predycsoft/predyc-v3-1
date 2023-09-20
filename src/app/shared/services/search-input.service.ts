import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchInputService {

  private _dataSubject = new Subject<string>();

  dataObservable$ = this._dataSubject.asObservable();

  sendData(data: string) {
    this._dataSubject.next(data);
  }
}
