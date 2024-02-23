import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {

  constructor(
    private dialog: MatDialogRef<AlertComponent>,
    @Inject (MAT_DIALOG_DATA) public data: any,
  ) { }
  
  mensaje = this.data.mensaje

  ngOnInit(): void {
  }

  closeDialog(){
    this.dialog.close()
  }

}
