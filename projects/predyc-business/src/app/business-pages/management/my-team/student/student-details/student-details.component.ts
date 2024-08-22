import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Profile } from 'projects/shared/models/profile.model';
import { User, UserJson } from 'projects/shared/models/user.model';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { Log } from 'projects/predyc-business/src/app/business-pages/dashboard/users-study-time-container/users-study-time-container.component';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';


@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent {
  
  @Input() student: User
  originalStudentData: UserJson
  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private alertService: AlertsService,
    private courseService: CourseService,
    private enterpriseService: EnterpriseService,
  ){}

  studentProfile: Profile
  courseServiceSubscription: Subscription

  logs: Log[] = []
  logsInCurrentMonth: Log[] = []
  hoursTimeMonth: number
  ritmo

  currentMonth = new Date().getUTCMonth();  

  currentYear = new Date().getUTCFullYear()
  enterprise
  textWarning = ''
  colorWarning = ''
  iconWarning
  listDetailWarning = []
  progreso = '0'
  progressPushed = false;

  getProgreso(progreso){
    this.progreso = `${progreso > 0 ? progreso.toFixed(0) : 0}`
    if(!this.noMoreMensajes && !this.progressPushed){
      this.listDetailWarning.push(`Ha completado el ${this.progreso}% de su plan de estudios.`)
      this.progressPushed = true
    }

  }

  getRitmo(ritmoIn){
    // console.log('ritmoIn',ritmoIn)

    let ritmo = ritmoIn.ritmo

    if(this.textWarning == ''){

      let ultimaActividad = this.getFechaUltimaActividad()
      if(ritmo == 'high'){
        this.textWarning = 'Ritmo Óptimo'
        this.colorWarning = 'green'
        this.iconWarning = this.icon.greenCheck
      }
      else if(ritmo == 'medium'){
        this.textWarning = 'Ritmo Medio'
        this.colorWarning = 'yellow'
        this.iconWarning = this.icon.warning
      }
      else if(ritmo == 'low'){
        this.textWarning = 'Ritmo Bajo'
        this.colorWarning = 'red'
        this.iconWarning = this.icon.redWarning2
      }
      else{
        this.textWarning = 'Sin Clases'
        this.colorWarning = 'gray'
        this.iconWarning = this.icon.warning
      }

      if(ritmoIn.retrasados.length == 0){
        this.listDetailWarning.push(`El estudiante no tiene un cursos atrasados.`)
      }
      else if(ritmoIn.retrasados.length == 1){
        this.listDetailWarning.push(`El estudiante tiene un curso atrasado.`)
      }
      else{
        this.listDetailWarning.push(`El estudiante tiene ${ritmoIn.retrasados.length} cursos atrasados.`)
      }
      this.listDetailWarning.push(ultimaActividad)
    }
  }


  getFechaUltimaActividad(){

    let activityStatus = null;
    let dateLastActivity = null
    let lastActivityText = 'El usuario no ha tenido actividad registrada.';

    if (this.student['lastActivityDate']?.seconds) {
      let date = new Date(this.student['lastActivityDate'].seconds * 1000);
      date.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00.000
      activityStatus = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
      dateLastActivity = date.getTime();
    
      // Crear la variable de texto para indicar hace cuánto fue la última actividad
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let diffTime = Math.abs(today.getTime() - date.getTime());
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Diferencia en días
    
      if (diffDays === 0) {
        lastActivityText = `La última actividad fue hoy.`;
      } else if (diffDays <= 30) {
        if(diffDays == 1){
          lastActivityText = `La última actividad fue hace 1 día.`;
        }
        else{
          lastActivityText = `La última actividad fue hace ${diffDays} días.`;
        }
      } else {
        lastActivityText = 'La última actividad fue hace más de 30 días.';
      }
    }
    return lastActivityText
  }


  

  ngOnInit() {
    this.listDetailWarning = []
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        this.enterprise = this.enterpriseService.getEnterprise();
        // console.log('Datos',this.enterprise, this.student)
        this.getDiagnosticTestForProfile()
      }
    })


    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null
    if (this.student) this.originalStudentData = {... this.student};  
  }

  diagnosticTestSubscription: Subscription;
  diagnosticTest;
  noMoreMensajes = false

  getDiagnosticTestForProfile() {
    if (this.diagnosticTestSubscription)
      this.diagnosticTestSubscription.unsubscribe();
    this.diagnosticTestSubscription = this.profileService
      .getDiagnosticTestForUser$(this.student)
      .subscribe((diagnosticTests) => {
        if (diagnosticTests.length === 0){
          
          if((this.enterprise?.examenInicial !== false)){
            this.textWarning = 'No ha presentado el examen diagnóstico'
            this.colorWarning = 'red'
            this.iconWarning = this.icon.redWarning2
            this.listDetailWarning.push('Debe completar el examen diagnóstico para continuar')
            this.noMoreMensajes = true
          }
          
          return
        } ;

        let diagnosticTest

        let certificationTest = diagnosticTests.find(x=>x.diagnosticTests)

        if(certificationTest){

          certificationTest?.resultByClass?.forEach(element => {
            element.averageScore = element.score
          });
          diagnosticTest = certificationTest

        }
        else{
          diagnosticTest = diagnosticTests.find(x=>x.profileRef.id == this.student.profile.id)
        }

        this.diagnosticTest = {
          ...diagnosticTest,
          date: firestoreTimestampToNumberTimestamp(diagnosticTest.date),
        };
        

      });
  }

  async onStudentSaveHandler(student: User) {
    try {
      const [hasUserDataChanged, hasProfileChanged] = this.hasDataChanges(student);
      if (hasUserDataChanged){
        this.originalStudentData = {...student}
        if(hasProfileChanged) {
          this.studentProfile = this.profileService.getProfile(student.profile.id)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  hasDataChanges(newStudent: User) {
    let originalData = {...this.originalStudentData, profile: undefined, enterprise: undefined};
    let newData = {...newStudent, profile: undefined, enterprise: undefined};
  
    if (this.originalStudentData.profile) { originalData.profile = this.originalStudentData.profile.id; }
    if (this.originalStudentData.enterprise) { originalData.enterprise = this.originalStudentData.enterprise.id; }
    if (newStudent.profile) { newData.profile = newStudent.profile.id; }
    if (newStudent.enterprise) { newData.enterprise = newStudent.enterprise.id; }
    
    let hasProfileChanged = false
    if (originalData.profile != newData.profile) hasProfileChanged = true
    
    return [JSON.stringify(originalData) !== JSON.stringify(newData), hasProfileChanged];
  }

}
