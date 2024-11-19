import { Enterprise } from "./enterprise.model";
import { Modulo } from "./module.model";
import { Skill } from './skill.model';
import { DocumentReference } from "@angular/fire/compat/firestore"
import { User } from "./user.model";

export interface CursoJson {

  descripcion: string
  metaDescripcion: string
  resumen: string
  nuevo: boolean
  proximamente: boolean
  public:boolean,
  idioma: string
  imagen: string
  contenido: string
  instructor: string
  imagen_instructor: string
  resumen_instructor: string
  foto: string
  id: string
  instructorRef: DocumentReference
  instructorNombre: string
  skillsRef: DocumentReference<Skill>[]
  nivel: string
  titulo: string
  instructorDescripcion: string
  vimeoFolderId: string 
  enterpriseRef: DocumentReference<Enterprise>
  idOld: string
  duracion: number,
  customUrl: string
  objetivos: ObjetivoCurso[] ,
  KeyWords:string,
  updatedAt: any
  isFree: boolean
  reviewsScore: number
  reviewsQty: number
  precio: number
  precioOferta: number
  modules:any
  stripeUrl:string
}

export class Curso {

  public static collection = 'course'
  public static collectionP21 = 'courseP21'
  public static DiplomadoP21 = 'diplomadoP21'

  
  descripcion: string = ""
  metaDescripcion: string = ""
  resumen: string = ""
  nuevo: boolean = false
  proximamente: boolean = false;
  public:boolean=false
  idioma: string = "Español"
  imagen: string = ""
  contenido: string = ""
  instructor: string = ""
  imagen_instructor: string = ""
  resumen_instructor: string = ""
  foto: string = ""
  id: string = ""
  //instructorFoto: string = ""
  instructorRef: DocumentReference = null
  instructorNombre: string = ""
  //instructorResumen: string = ""
  //modulos: Modulo[] = []
  skillsRef: DocumentReference<Skill>[] = []
  nivel: string = ""
  titulo: string = ""
  instructorDescripcion: string = ""
  vimeoFolderId: string = ""
  enterpriseRef: DocumentReference<Enterprise> = null
  idOld: string = ""
  duracion: number = 0
  customUrl: string = ""
  objetivos: ObjetivoCurso[] = []
  KeyWords:string = ""
  updatedAt: any = null
  isFree: boolean = false
  reviewsScore: number = 0
  reviewsQty: number = 0
  precio: number = null
  precioOferta: number = null
  modules:any
  stripeUrl:string = ""


  public toJson(): CursoJson {
    return {

      descripcion:this.descripcion,
      metaDescripcion:this.metaDescripcion,
      resumen:this.resumen,
      nuevo:this.nuevo,
      proximamente:this.proximamente,
      public:this.public,
      idioma:this.idioma,
      imagen:this.imagen,
      contenido:this.contenido,
      instructor:this.instructor,
      imagen_instructor:this.imagen_instructor,
      resumen_instructor:this.resumen_instructor,
      foto:this.foto,
      id:this.id,
      instructorRef:this.instructorRef,
      instructorNombre:this.instructorNombre,
      skillsRef:this.skillsRef,
      nivel:this.nivel,
      titulo:this.titulo,
      instructorDescripcion:this.instructorDescripcion,
      vimeoFolderId:this.vimeoFolderId,
      enterpriseRef:this.enterpriseRef,
      idOld:this.idOld,
      duracion:this.duracion,
      customUrl:this.customUrl,
      objetivos:this.objetivos,
      KeyWords:this.KeyWords,
      updatedAt:this.updatedAt,
      isFree: this.isFree,
      reviewsScore: this.reviewsScore,
      reviewsQty: this.reviewsQty,
      precio: this.precio,
      precioOferta: this.precioOferta,
      modules: this.modules,
      stripeUrl:this.stripeUrl

    }
  }
}

export interface ObjetivoCurso {
  titulo: string
  descripcion: string
}

export class CourseRating {

  public static collection = 'cursosValoraciones'

  userRef: DocumentReference<User>
  courseRef: DocumentReference<Curso>
  id: string
  valoracion: {
    comentario: string
    completado: boolean
    conocimientos: number
    fecha: string
    global: number
    instructor: number
    material: number
    plataforma: number
  }
}