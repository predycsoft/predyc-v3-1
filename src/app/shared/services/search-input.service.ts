import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchInputService {

  // private _dataSubject = new Subject<string>();
  private _dataSubject = new BehaviorSubject<string>("");

  dataObservable$ = this._dataSubject.asObservable();

  sendData(data: string) {
    this._dataSubject.next(data);
  }

  getData() {
    return this._dataSubject.value;
  }
}
