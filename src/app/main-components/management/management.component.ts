import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css']
})
export class ManagementComponent {

  constructor(
    private loaderService: LoaderService,
  ) {}

  ngOnInit(): void {
    console.log("Inicio de managment component")
  }

}
