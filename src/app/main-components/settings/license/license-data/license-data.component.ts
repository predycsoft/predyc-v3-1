import { Component, EventEmitter, Output } from '@angular/core';
import { LoaderService } from 'src/app/shared/services/loader.service';

@Component({
  selector: 'app-license-data',
  templateUrl: './license-data.component.html',
  styleUrls: ['./license-data.component.css']
})
export class LicenseDataComponent {
  constructor(
    private loaderService: LoaderService,
    ) {}
    
  supportFlag = false

  @Output() supportFlagChanged: EventEmitter<boolean> = new EventEmitter();

  onContactoDeVentasClicked() {
    this.supportFlagChanged.emit(true);
  }

}
