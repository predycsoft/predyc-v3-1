import { Component, Input } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Question } from 'projects/shared/models/question.model';

interface CourseQuestionsData {
  courseQuestions: Question[]
  courseId: string,
  coursePhoto: string,
  courseTitle: string,
  intructorName: string,
  questionsQty: number,
  answeredQuestions: number
  pendingQuestions: number,
  lastQuestion: number,
  lastAnswere: number,
  timeWithoutAnswer: number | null
}

@Component({
  selector: 'app-dialog-questions-detail',
  templateUrl: './dialog-questions-detail.component.html',
  styleUrls: ['./dialog-questions-detail.component.css']
})
export class DialogQuestionsDetailComponent {

  oneDay = 24*60*60*1000
  hoy = +new Date
  
  constructor(
    public activeModal: NgbActiveModal,
    private afs: AngularFirestore,
    // private route: ActivatedRoute,
  ) { }

  @Input() courseQuestionsData: CourseQuestionsData;

  // Si vamos a editar entonces debe tener un id en la ruta
  // id = this.route.snapshot.paramMap.get('id'); // courseId
  preguntas: {data: Question, respondiendo: boolean}[]
  cantPreguntas = 0
  cantPreguntasRespondidas = 0
  cantPreguntasSinResponder = 0
  tiempoSinResponder = null
  ultimaPregunta = null
  respuesta = ""
  tab = 0
  filteredPreguntas = []

  ngOnInit() {
    console.log("this.courseQuestionsData", this.courseQuestionsData)
    if (this.courseQuestionsData.courseQuestions.length > 0){
      this.preguntas = this.courseQuestionsData.courseQuestions.map(k => [{data: k, respondiendo: false}][0])
      console.log("this.preguntas", this.preguntas)
      this.cantPreguntas = this.preguntas.length
      this.cantPreguntasRespondidas = this.courseQuestionsData.answeredQuestions
      this.cantPreguntasSinResponder = this.courseQuestionsData.pendingQuestions
      this.tiempoSinResponder = this.courseQuestionsData.timeWithoutAnswer
    }
    this.filteredPreguntas = this.preguntas.sort((a,b) => b.data.timestamp - a.data.timestamp)
  }

  responder(i){
    this.preguntas[i].respondiendo = false
    this.preguntas[i].data.timestampRespuesta = + new Date
    this.preguntas[i].data.respondida = true
    // this.preguntas[i].data.respondidaInstructor = false // Because it was responded by admin
    // this.preguntas[i].data.instructorNombre = "Predyc",
    // this.preguntas[i].data.instructorFoto =  "assets/images/logos/logo.svg"
    this.afs.collection(Question.collection).doc(this.preguntas[i].data.id).set(this.preguntas[i].data, {merge: true})
    // firstValueFrom(this.functions.httpsCallable("respuestaPregunta")({
    //   pregunta: this.preguntas[i].data.pregunta,
    //   respuesta: this.preguntas[i].data.respuesta,
    //   usuarioId: this.preguntas[i].data.usuarioId,
    //   curso: this.preguntas[i].data.cursoTitulo,
    //   clase: this.preguntas[i].data.claseTitulo
    // })).catch(error => {
    //   console.log(error)
    // })
  }

  eliminar(i){
    // this.afs.collection("cursos").doc(this.id).collection("preguntas").doc(this.preguntas[i].data.timestamp.toString()).delete()
    // this.preguntas.splice(i,1)
  }

  filtrar(){
    if (this.tab == 0) {
      this.filteredPreguntas= this.preguntas
    }
    if (this.tab == 1) {
      this.filteredPreguntas = this.preguntas.filter(x => x.data.respondida == false)
    }
    if(this.tab == 2) {
      this.filteredPreguntas = this.preguntas.filter(x => x.data.respondida == true)
    }
  }


}
