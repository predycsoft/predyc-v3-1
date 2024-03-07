import { DocumentReference } from "@angular/fire/compat/firestore"
  
  export class Clase {

    public static collection = 'class'

    HTMLcontent: string = ""
    archivos: any[] = [];
    skillsRef: DocumentReference[] = []
    descripcion: string = ""
    duracion: number = 0
    id: string = '0'
    vimeoId1: number = 0
    vimeoId2 : string = ""
    tipo: string = "video"
    titulo: string = ""
    vigente: boolean = true
    videoFileName: string = ""
    date:number=0
    instructorRef :DocumentReference = null

    public toJson() {
      return {
        HTMLcontent: this.HTMLcontent,
        archivos: this.archivos,
        skillsRef: this.skillsRef,
        descripcion: this.descripcion,
        duracion: this.duracion,
        id: this.id,
        vimeoId1: this.vimeoId1,
        vimeoId2 : this.vimeoId2,
        tipo: this.tipo,
        titulo: this.titulo,
        vigente: this.vigente,
        videoFileName: this.videoFileName,
        date: this.date,
        instructorRef: this.instructorRef
      }
  }

  }