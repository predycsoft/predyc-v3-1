import { Component, OnInit, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IconService } from 'src/app/services/icon.service';

@Component({
  selector: 'app-dialog-confirmar-agregar-curso',
  templateUrl: './dialog-confirmar-agregar-curso.component.html',
  styleUrls: ['./dialog-confirmar-agregar-curso.component.css']
})
export class DialogConfirmarAgregarCursoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogConfirmarAgregarCursoComponent>,
    public icon: IconService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    console.log("this.data")
    console.log(this.data)
  }

  guardar(){
    this.dialogRef.close(true)
  }

  salir(){
    this.dialogRef.close(false)
  }

}

