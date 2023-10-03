import { Component } from '@angular/core';
import { LoaderService } from 'src/app/shared/services/loader.service';

@Component({
  selector: 'app-licences-data',
  templateUrl: './licences-data.component.html',
  styleUrls: ['./licences-data.component.css']
})
export class LicencesDataComponent {
  constructor(
    private loaderService: LoaderService,
  ) {}

}
