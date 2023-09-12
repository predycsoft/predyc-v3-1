import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';

@AfterOnInitResetLoading
@Component({
  selector: 'app-departments-profiles',
  templateUrl: './departments-profiles.component.html',
  styleUrls: ['./departments-profiles.component.css']
})
export class DepartmentsProfilesComponent {
  constructor(
    public icon: IconService,
    private loaderService: LoaderService,
  ){}
}
