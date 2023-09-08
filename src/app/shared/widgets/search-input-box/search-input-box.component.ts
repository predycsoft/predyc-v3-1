import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-search-input-box',
  templateUrl: './search-input-box.component.html',
  styleUrls: ['./search-input-box.component.css']
})
export class SearchInputBoxComponent {

  @Output() inputChanged = new EventEmitter<string>();
  @ViewChild('input') inputElement: ElementRef

  onInputChanged() {
    this.inputChanged.emit(this.inputElement.nativeElement.value)
  }

}
