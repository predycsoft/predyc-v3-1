import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirmar',
  templateUrl: './dialog-confirmar.component.html',
  styleUrls: ['./dialog-confirmar.component.css']
})
export class DialogConfirmarComponent implements OnInit {

  
  textoConfirmacion: string;

  constructor(
    public dialogRef: MatDialogRef<DialogConfirmarComponent>,
  ) { }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

}
