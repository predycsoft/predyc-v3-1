import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Question } from 'projects/shared/models/question.model';
import { IconService } from '../../../services/icon.service';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { QuestionService } from '../../../services/question.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { capitalizeFirstLetter, firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { VimeoComponent } from '../../vimeo/vimeo.component';

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
    private fireFunctions: AngularFireFunctions,
    public icon: IconService,
    private courseService: CourseService, 
    private moduleService: ModuleService,
    private userService: UserService,
    private questionService: QuestionService,
    private modalService: NgbModal,
  ) { }

  @Input() courseQuestionsData: CourseQuestionsData;
  @Input() mode: string = 'admin';


  preguntas: { data: Question, respondiendo: boolean, claseTitulo: string, instructorNombre: string, instructorFoto: string, usuarioNombre: string }[] = [];
  cantPreguntas = 0
  cantPreguntasRespondidas = 0
  cantPreguntasSinResponder = 0
  ultimaPregunta = null
  respuesta = ""
  tab = 0
  filteredPreguntas = []
  mostrarPregunta: boolean

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
              return courseClasses;
            })
          );
        })
      ).subscribe(async classMap => {
        const preguntasPromises = this.courseQuestionsData.courseQuestions.map(async question => {
          const userData = await this.userService.getUserByUid(question.userRef.id)
          const claseData = classMap.find(x=>x.id == question.claseRef.id)
          return {
            data: question,
            respondiendo: false,
            claseTitulo: claseData?.titulo,
            claseType:claseData.tipo,
            vimeoId1:claseData.vimeoId1,
            vimeoId2:claseData.vimeoId2,
            cursoTitulo: this.courseQuestionsData.courseTitle,
            instructorNombre: this.courseQuestionsData.instructorName,
            instructorFoto: this.courseQuestionsData.instructorPhoto,
            usuarioNombre: userData.displayName,
            usuarioFoto: userData.photoUrl,
            usuarioEmail: userData.email
          }
        });
  
        this.preguntas = await Promise.all(preguntasPromises);
        // console.log("this.preguntas", this.preguntas);
        this.filteredPreguntas = this.preguntas.sort((a, b) => {
          return firestoreTimestampToNumberTimestamp(b.data.timestamp) - firestoreTimestampToNumberTimestamp(a.data.timestamp);
        }) 
      });
    }
  }

  async responder(i, isInstructor: boolean){
    // console.log("this.preguntas[i]", this.preguntas[i])
    this.preguntas[i].respondiendo = false
    this.preguntas[i].data.timestampRespuesta = new Date
    this.preguntas[i].data.respondida = true
    this.preguntas[i].data.respondidaInstructor = isInstructor
    this.questionService.answereQuestion(this.preguntas[i].data.id, this.preguntas[i].data.timestampRespuesta, this.preguntas[i].data.respuesta, this.preguntas[i].data.respondidaInstructor)

    await this.onSendMail(this.preguntas[i])
  }

  async onSendMail(data: any) {

    const sender = "desarrollo@predyc.com";
    const recipients = [data.usuarioEmail];
    // const recipients = ['diegonegrette42@gmail.com'];
    const subject = "¡Han respondido tu consulta en Predyc!";
    const text = `Hola ${capitalizeFirstLetter(data.usuarioNombre)}, han respondido tu consulta del curso ${data.cursoTitulo} en la clase ${data.claseTitulo}.
    \nPregunta: "${data.data.pregunta}"
    \nRespuesta: "${data.data.respuesta}"
    \nTe invitamos a entrar a tu cuenta y ver información o material adicional que este disponible para los estudiantes. 
    \nSi tienes alguna duda, el equipo de Predyc estará para asesorarte.
    \n¡Felicidades por acelerar tu formación profesional con Predyc!`
    const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com"];

    const mailObj = { sender, recipients, subject, text, cc };

    // console.log("mailObj", mailObj)
    await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')(mailObj));
    console.log("email sent")
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

  verVideoVimeo(clase): any {

    clase.titulo = clase.cursoTitulo + ' - ' + clase.claseTitulo

    const modalRef = this.modalService.open(VimeoComponent, {
      animation: true,
      centered: true,
      size: "lg",
    });
    modalRef.componentInstance.clase = clase;
    return modalRef;
  }

  async cambiarMostrarPregunta(i, questionId: string, value: boolean) {
    // console.log("this.preguntas[i]", this.preguntas[i])
    this.preguntas[i].data.mostrarPregunta = value
    await this.questionService.updateMostrarPregunta(questionId, value)
  }

}
