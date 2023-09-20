import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { SearchInputService } from '../../services/search-input.service';

@Component({
  selector: 'app-search-input-box',
  templateUrl: './search-input-box.component.html',
  styleUrls: ['./search-input-box.component.css']
})
export class SearchInputBoxComponent {

  @ViewChild('input') inputElement: ElementRef

  constructor(private searchInputService: SearchInputService) {}

  onInputChanged() {
    this.searchInputService.sendData(this.inputElement.nativeElement.value)
  }

}
