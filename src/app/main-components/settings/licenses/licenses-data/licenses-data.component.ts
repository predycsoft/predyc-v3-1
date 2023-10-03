import { Component } from '@angular/core';
import { LoaderService } from 'src/app/shared/services/loader.service';

@Component({
  selector: 'app-licenses-data',
  templateUrl: './licenses-data.component.html',
  styleUrls: ['./licenses-data.component.css']
})
export class LicensesDataComponent {
  constructor(
    private loaderService: LoaderService,
  ) {}

}
