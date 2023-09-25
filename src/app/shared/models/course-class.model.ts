import { DocumentReference } from "@angular/fire/compat/firestore"

  
  export class Clase {

    public static collection = 'class'

    HTMLcontent: string = ""
    archivos: any[] = [];
    sillsRef: DocumentReference[] = []
    descripcion: string = ""
    duracion: number = 0
    id: string = '0'
    idVideo: number = 0
    idVideoNew : string = ""
    tipo: string = "video"
    titulo: string = ""
    vigente: boolean = true


    public toJson() {
      return {
        HTMLcontent: this.HTMLcontent,
        archivos: this.archivos,
        sillsRef: this.sillsRef,
        descripcion: this.descripcion,
        duracion: this.duracion,
        id: this.id,
        idVideo: this.idVideo,
        idVideoNew : this.idVideoNew,
        tipo: this.tipo,
        titulo: this.titulo,
        vigente: this.vigente,
      }
  }



  }