import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-dialog',
  templateUrl: './video-dialog.component.html',
  styleUrls: ['./video-dialog.component.css']
})
export class VideoDialogComponent {
  videoUrl: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private sanitizer: DomSanitizer) {
    // Trust the provided YouTube URL
    this.videoUrl = data.videoUrl;
  }
}
