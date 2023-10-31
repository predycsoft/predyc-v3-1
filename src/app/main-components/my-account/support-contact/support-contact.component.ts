import { Component, Input } from '@angular/core';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-support-contact',
  templateUrl: './support-contact.component.html',
  styleUrls: ['./support-contact.component.css']
})
export class SupportContactComponent {
  @Input() enterprise: Enterprise
  constructor(
    public icon:IconService,

  ){}
  
}
