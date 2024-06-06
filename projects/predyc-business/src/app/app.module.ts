import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from 'projects/predyc-business/src/environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SETTINGS} from '@angular/fire/compat/firestore';


// Components
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './business-pages/dashboard/dashboard.component';
import { ManagementComponent } from './business-pages/management/management.component';
import { CoursesComponent } from './business-pages/management/courses/courses.component';
import { ValidationComponent } from './business-pages/validation/validation.component';
import { SettingsComponent } from './business-pages/settings/settings.component';
import { MyTeamComponent } from './business-pages/management/my-team/my-team.component';
import { NotificationsComponent } from './business-pages/management/notifications/notifications.component';
import { StudentComponent } from './business-pages/management/my-team/student/student.component';
import { CreateCourseComponent } from './business-pages/management/create-course/create-course.component';


// Emulators
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/compat/firestore';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/compat/functions';
import { USE_EMULATOR as USE_STORAGE_EMULATOR } from '@angular/fire/compat/storage';
import { MainComponent } from './business-pages/main.component';
import { MyAccountComponent } from './business-pages/my-account/my-account.component';
import { EnterpriseInfoFormComponent } from './business-pages/my-account/enterprise-data/enterprise-info-form/enterprise-info-form.component';
import { AdminInfoFormComponent } from './business-pages/my-account/admin-data/admin-info-form/admin-info-form.component';
import { EnterpriseDataComponent } from './business-pages/my-account/enterprise-data/enterprise-data.component';
import { AdminDataComponent } from './business-pages/my-account/admin-data/admin-data.component';
import { EnterprisePresentationFormComponent } from './business-pages/my-account/enterprise-data/enterprise-presentation-form/enterprise-presentation-form.component';
import { AdminPresentationFormComponent } from './business-pages/my-account/admin-data/admin-presentation-form/admin-presentation-form.component';
import { ValidationListComponent } from './business-pages/validation/validation-list/validation-list.component';
import { EditValidationTestComponent } from './business-pages/validation/edit-validation-test/edit-validation-test.component';
import { RankingListComponent } from './business-pages/dashboard/ranking-list/ranking-list.component';
import { StudentStatsComponent } from './business-pages/management/my-team/student/student-stats/student-stats.component';
import { StudentDetailsComponent } from './business-pages/management/my-team/student/student-details/student-details.component';
import { UsersRhythmComponent } from './business-pages/dashboard/users-rhythm/users-rhythm.component';
import { UsersStudyTimeContainerComponent } from './business-pages/dashboard/users-study-time-container/users-study-time-container.component';
import { StudyTimeWeeklyChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-weekly-chart/study-time-weekly-chart.component';
import { StudyTimeMonthlyChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-monthly-chart/study-time-monthly-chart.component';
import { CreateUserComponent } from './business-pages/management/my-team/student/create-user/create-user.component';
import { ProfilesComponent } from './business-pages/management/profiles/profiles.component';

import { StudentInfoFormComponent } from './business-pages/management/my-team/student/student-info-form/student-info-form.component';
import { StudentStudyPlanAndCompetencesComponent } from './business-pages/management/my-team/student/student-study-plan-and-competences/student-study-plan-and-competences.component';
import { StudyTimeMonthlyLineChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-monthly-line-chart/study-time-monthly-line-chart.component';
import { SharedModule } from 'projects/predyc-business/src/shared/shared.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CertificationsTestComponent } from './business-pages/management/certificationsTest/certificationsTest.component';
import { ProfilesListComponent } from './business-pages/management/profiles-list/profiles-list.component';
import { UsersOnboardingComponent } from './business-pages/dashboard/users-onboarding/users-onboarding.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    ManagementComponent,
    CoursesComponent,
    ValidationComponent,
    SettingsComponent,
    MyTeamComponent,
    ProfilesListComponent,
    NotificationsComponent,
    StudentComponent,
    MainComponent,
    CreateCourseComponent,
    CertificationsTestComponent,
    MyAccountComponent,
    EnterprisePresentationFormComponent,
    EnterpriseInfoFormComponent,
    AdminPresentationFormComponent,
    AdminInfoFormComponent,
    EnterpriseDataComponent,
    AdminDataComponent,
    ValidationListComponent,
    EditValidationTestComponent,
    RankingListComponent,
    UsersOnboardingComponent,
    StudentStatsComponent,
    StudentDetailsComponent,
    UsersRhythmComponent,
    UsersStudyTimeContainerComponent,
    StudyTimeWeeklyChartComponent,
    StudyTimeMonthlyChartComponent,
    CreateUserComponent,
    ProfilesComponent,
    StudentInfoFormComponent,
    StudentStudyPlanAndCompetencesComponent,
    StudyTimeMonthlyLineChartComponent,    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    NgbModule,
  ],
  providers: [
    { provide: SETTINGS, useValue: { ignoreUndefinedProperties: true } },
    {
      provide: USE_FIRESTORE_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 8080] : undefined,
    },
    {
      provide: USE_AUTH_EMULATOR,
      useValue: environment.useEmulators ? ['http://localhost:9099'] : undefined,
    },
    {
      provide: USE_STORAGE_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 9199] : undefined,
    },
    {
      provide: USE_FUNCTIONS_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 5001] : undefined,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
