import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '../../../shared/services/icon.service';
import { VideoDialogComponent } from './video-dialog/video-dialog.component';


@Component({
  selector: 'app-management-dashboard',
  templateUrl: './management-dashboard.component.html',
  styleUrls: ['./management-dashboard.component.css']
})
export class ManagementDashboardComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    public icon: IconService
  ) {}

  navigateTo(url: string) {
    this.router.navigate([url], {relativeTo: this.activatedRoute})
  }

  openVideo(): void {
    const videoLink = 'https://www.youtube.com/embed/QUNrBEhvXWQ';
    this.dialog.open(VideoDialogComponent, {
      data: { videoUrl: videoLink }
    });
  }
}