import { Component, Input } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Question } from 'projects/shared/models/question.model';
import { IconService } from '../../../services/icon.service';
import { firestoreTimestampToNumberTimestamp } from 'shared';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { map, switchMap } from 'rxjs';
import { UserService } from '../../../services/user.service';

interface CourseQuestionsData { // it has to be he same as the one declared in questions-list component
  courseQuestions: Question[]
  courseId: string,
  coursePhoto: string,
  courseTitle: string,
  instructorName: string,
  instructorPhoto: string,
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

  logo = "assets/images/logos/logo.png"
  
  constructor(
    public activeModal: NgbActiveModal,
    private afs: AngularFirestore,
    public icon: IconService,
    private courseService: CourseService, 
    private moduleService: ModuleService,
    private userService: UserService
  ) { }

  @Input() courseQuestionsData: CourseQuestionsData;

  preguntas: { data: Question, respondiendo: boolean, claseTitulo: string, instructorNombre: string, instructorFoto: string, usuarioNombre: string }[] = [];
  cantPreguntas = 0
  cantPreguntasRespondidas = 0
  cantPreguntasSinResponder = 0
  ultimaPregunta = null
  respuesta = ""
  tab = 0
  filteredPreguntas = []

  async ngOnInit() {
    console.log("this.courseQuestionsData", this.courseQuestionsData)
    if (this.courseQuestionsData.courseQuestions.length > 0) {
      this.courseQuestionsData.courseQuestions.forEach(courseQuestion => {
        courseQuestion.timestamp = firestoreTimestampToNumberTimestamp(courseQuestion.timestamp)
        courseQuestion.timestampRespuesta = courseQuestion.timestampRespuesta ? firestoreTimestampToNumberTimestamp(courseQuestion.timestampRespuesta) : 0
      });

      this.cantPreguntas = this.courseQuestionsData.questionsQty
      this.cantPreguntasRespondidas = this.courseQuestionsData.answeredQuestions
      this.cantPreguntasSinResponder = this.courseQuestionsData.pendingQuestions

      this.moduleService.getModules$(this.courseQuestionsData.courseId).pipe(
        switchMap(modules => {
          const allClassIds = modules.flatMap(module => module.clasesRef.map(ref => ref.id));
          return this.courseService.getClassesByIds$(allClassIds).pipe(
            map(courseClasses => {
              const classMap = new Map(courseClasses.map(courseClass => [courseClass.id, courseClass.titulo]));
              return classMap;
            })
          );
        })
      ).subscribe(async classMap => {
        const preguntasPromises = this.courseQuestionsData.courseQuestions.map(async question => ({
          data: question,
          respondiendo: false,
          claseTitulo: classMap.get(question.claseRef.id) || 'N/A',
          instructorNombre: this.courseQuestionsData.instructorName,
          instructorFoto: this.courseQuestionsData.instructorPhoto,
          usuarioNombre: (await this.userService.getUserByUid(question.userRef.id)).displayName,
          usuarioFoto: (await this.userService.getUserByUid(question.userRef.id)).photoUrl
        }));
  
        this.preguntas = await Promise.all(preguntasPromises);
        console.log("this.preguntas", this.preguntas);
        this.filteredPreguntas = this.preguntas.sort((a, b) => {
          return firestoreTimestampToNumberTimestamp(b.data.timestamp) - firestoreTimestampToNumberTimestamp(a.data.timestamp);
        }) 
      });
    }
  }

  responder(i){
    this.preguntas[i].respondiendo = false
    this.preguntas[i].data.timestampRespuesta = new Date
    this.preguntas[i].data.respondida = true
    console.log("data to save: ", this.preguntas[i].data)
    this.afs.collection(Question.collection).doc(this.preguntas[i].data.id).set({
      timestampRespuesta: this.preguntas[i].data.timestampRespuesta,
      respondida: true,
      respuesta: this.preguntas[i].data.respuesta
    }, {merge: true})


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

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }

}
