
import { Clase } from "./course-class.model";

  export class Modulo {
    titulo: string = ""
    numero: number = 0
    duracion: number = 0
    expanded: boolean = false
    clases: Clase[] = []
  }
  