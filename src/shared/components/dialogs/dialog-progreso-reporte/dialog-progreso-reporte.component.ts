import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-progreso-reporte',
  templateUrl: './dialog-progreso-reporte.component.html',
  styleUrls: ['./dialog-progreso-reporte.component.css']
})
export class DialogProgresoReporteComponent implements OnInit {

  constructor(
    private dialog: MatDialogRef<DialogProgresoReporteComponent>,
    @Inject (MAT_DIALOG_DATA) public data: any,
  ) { }

  loading = 0
  async ngOnInit() {

  }
}
