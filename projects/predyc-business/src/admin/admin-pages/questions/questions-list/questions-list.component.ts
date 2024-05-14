import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { QuestionService } from 'projects/predyc-business/src/shared/services/question.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { Question, QuestionJson } from 'projects/shared/models/question.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { Curso } from 'projects/shared/models/course.model';
import { firestoreTimestampToNumberTimestamp } from 'shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogQuestionsDetailComponent } from 'projects/predyc-business/src/shared/components/questions/dialog-questions-detail/dialog-questions-detail.component';

  interface CourseQuestionsData {
    courseQuestions: Question[]
    courseId: string,
    coursePhoto: string,
    courseTitle: string,
    instructorPhoto: string,
    instructorName: string,
    questionsQty: number,
    answeredQuestions: number
    pendingQuestions: number,
    lastQuestion: number,
    lastAnswere: number,
    timeWithoutAnswer: number | null
  }


@Component({
  selector: 'app-questions-list',
  templateUrl: './questions-list.component.html',
  styleUrls: ['./questions-list.component.css']
})
export class QuestionsListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private questionService: QuestionService,
    private instructorService: InstructorsService,
    private courseService: CourseService,
    public icon: IconService,
		private modalService: NgbModal,
  ){}

  displayedColumns: string[] = [
    "Curso",
    "Instructor",
    "Preguntas",
    "Respondidas",
    "Pendientes",
    "UltimaPregunta",
    "TiempoSinResponder",
  ];

  dataSource = new MatTableDataSource<CourseQuestionsData>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() totalsCalculated = new EventEmitter<{answered: number, pending: number}>();

  pageSize: number = 16
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  courseSubscription: Subscription

  instructors: any[]
  questions: Question[]

  hoy = +new Date
  oneDay = 24*60*60*1000

  ngOnInit() {

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.questionService.getAllQuestions$(),
        this.instructorService.getInstructors$(),
      ]
    ).
    subscribe(([ questions, instructors]) => {
      this.instructors = instructors
      this.questions = questions
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(searchTerm, page);
      })
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm:string, page: number) {
    this.courseSubscription = this.courseService.getAllCourses$().subscribe(courses => {
      const dataInList: any[] = courses.map(course => {
        const instructorData = this.instructors.find( x => x.id === course.instructorRef.id)
        return this.getDataToShow(course, instructorData)
      })

      const filteredData = searchTerm ? dataInList.filter(sub => sub.cursoTitulo.toLowerCase().includes(searchTerm.toLowerCase())) : dataInList;
      filteredData.sort((a,b) => b.lastQuestion - a.lastQuestion)
      filteredData.sort((a,b) => b.timeWithoutAnswer - a.timeWithoutAnswer)
      // console.log("filteredData", filteredData)
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredData
      this.totalLength = filteredData.length;

      const totalAnswered = filteredData.reduce((acc, curr) => acc + curr.answeredQuestions, 0);
      const totalPending = filteredData.reduce((acc, curr) => acc + curr.pendingQuestions, 0);
      this.totalsCalculated.emit({answered: totalAnswered, pending: totalPending});
      
    })
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getDataToShow(course: Curso, instructor): CourseQuestionsData {
    const courseQuestions = this.questions.filter(x=> x.courseRef.id === course.id)

    let ultimaPregunta: number = null
    let ultimaRespuesta: number = null
    let tiempoSinResponder: number = null
    let cantPreguntasRespondidas = 0
    let cantPreguntasSinResponder = 0

    if (courseQuestions.length > 0) {
      // Convert and sort timestamps
      courseQuestions.sort((a, b) => {
        return firestoreTimestampToNumberTimestamp(b.timestamp) - firestoreTimestampToNumberTimestamp(a.timestamp);
      })
      ultimaPregunta = firestoreTimestampToNumberTimestamp(courseQuestions[0].timestamp)

      const respondedQuestions = courseQuestions.filter(x => x.respondida == true);
      if (respondedQuestions.length > 0) {
        respondedQuestions.sort((a, b) => {
          return firestoreTimestampToNumberTimestamp(b.timestampRespuesta) - firestoreTimestampToNumberTimestamp(a.timestampRespuesta);
        })
        ultimaRespuesta = firestoreTimestampToNumberTimestamp(respondedQuestions[0].timestampRespuesta)
        cantPreguntasRespondidas = respondedQuestions.length
      }

      const unansweredQuestions = courseQuestions.filter(x => x.respondida == false);
      cantPreguntasSinResponder = unansweredQuestions.length
      if (cantPreguntasSinResponder > 0) {
        unansweredQuestions.sort((a, b) => {
          return firestoreTimestampToNumberTimestamp(b.timestamp) - firestoreTimestampToNumberTimestamp(a.timestamp);
        })
        tiempoSinResponder = this.hoy - firestoreTimestampToNumberTimestamp(unansweredQuestions[0].timestamp);
      }
    }

    return {
      courseQuestions: courseQuestions,
      courseId: course.id,
      coursePhoto: course.foto,
      courseTitle: course.titulo,
      instructorPhoto: instructor.foto,
      instructorName: instructor.nombre,
      questionsQty: courseQuestions.length,
      answeredQuestions: cantPreguntasRespondidas,
      pendingQuestions: cantPreguntasSinResponder,
      lastQuestion: ultimaPregunta ,
      lastAnswere: ultimaRespuesta,
      timeWithoutAnswer:tiempoSinResponder
    }
  }

  async onSelect(data: CourseQuestionsData) {
		const modalRef = this.modalService.open(DialogQuestionsDetailComponent, {
			animation: true,
			centered: true,
			size: "xl",
			backdrop: "static",
			keyboard: false,
		});

		modalRef.componentInstance.courseQuestionsData = data;
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }


}
