import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgChartsModule } from 'ng2-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule, } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from "@angular/material/expansion";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatAutocompleteModule } from "@angular/material/autocomplete"

// Components
import { LoginComponent } from './login/login.component';
import { SideNavComponent } from './shared/components/sidenav/sidenav.component';
import { DashboardComponent } from './business-pages/dashboard/dashboard.component';
import { StudentListComponent } from './shared/components/users/student-list/student-list.component';
import { ManagementComponent } from './business-pages/management/management.component';
import { CoursesComponent } from './business-pages/management/courses/courses.component';
import { ValidationComponent } from './business-pages/validation/validation.component';
import { SettingsComponent } from './business-pages/settings/settings.component';
import { MyTeamComponent } from './business-pages/management/my-team/my-team.component';
import { NavigationCardComponent } from './shared/widgets/navigation-card/navigation-card.component';
import { NotificationsComponent } from './business-pages/management/notifications/notifications.component';
import { NavigateBackComponent } from './shared/widgets/navigate-back/navigate-back.component';
import { StudentProfileComponent } from './shared/components/users/student-profile/student-profile.component';
import { SearchInputBoxComponent } from './shared/widgets/search-input-box/search-input-box.component';
import { StudentComponent } from './business-pages/management/my-team/student/student.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { CreateCourseComponent } from './business-pages/management/create-course/create-course.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { DragDropModule } from '@angular/cdk/drag-drop';

//
import { SafePipe } from './shared/pipes/safe.pipe';
import { CustomDatePipe } from './shared/pipes/custom-date.pipe';

// Emulators
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/compat/firestore';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/compat/functions';
import { USE_EMULATOR as USE_STORAGE_EMULATOR } from '@angular/fire/compat/storage';
import { MainComponent } from './business-pages/main.component';
import { NotificationListComponent } from './shared/components/notifications/notification-list/notification-list.component';
import { AlertComponent } from './shared/services/dialogs/alert/alert.component';
import { DialogConfirmarComponent } from './shared/components/dialogs/dialog-confirmar/dialog-confirmar.component';
import { ExitoComponent } from './shared/components/dialogs/exito/exito.component';
import { VimeoUploadService } from './shared/services/vimeo-upload.service';
import { HttpClientModule } from '@angular/common/http';
import { InitScriptComponent } from './shared/components/init-script/init-script.component';
import { MyAccountComponent } from './business-pages/my-account/my-account.component';
import { EnterpriseInfoFormComponent } from './business-pages/my-account/enterprise-data/enterprise-info-form/enterprise-info-form.component';
import { AdminInfoFormComponent } from './business-pages/my-account/admin-data/admin-info-form/admin-info-form.component';
import { EnterpriseDataComponent } from './business-pages/my-account/enterprise-data/enterprise-data.component';
import { AdminDataComponent } from './business-pages/my-account/admin-data/admin-data.component';
import { EnterprisePresentationFormComponent } from './business-pages/my-account/enterprise-data/enterprise-presentation-form/enterprise-presentation-form.component';
import { AdminPresentationFormComponent } from './business-pages/my-account/admin-data/admin-presentation-form/admin-presentation-form.component';
import { SkillsSelectorComponent } from './shared/components/skills-selector/skills-selector.component';
import { CourseSelectorComponent } from './shared/components/course-selector/course-selector.component';
import { MembersComponent } from './business-pages/settings/members/members.component';
import { LicenseComponent } from './business-pages/settings/license/license.component';
import { PlanCardComponent } from './business-pages/settings/license/plan-card/plan-card.component';
import { LicenseDataComponent } from './business-pages/settings/license/license-data/license-data.component';
import { ValidationListComponent } from './business-pages/validation/validation-list/validation-list.component';
import { EditValidationTestComponent } from './business-pages/validation/edit-validation-test/edit-validation-test.component';
import { RankingListComponent } from './business-pages/dashboard/ranking-list/ranking-list.component';
import { TooltipPointsComponent } from './shared/components/tooltip-points/tooltip-points.component';
import { StudyPlanComponent } from './shared/components/study-plan/study-plan.component';
import { StudentStatsComponent } from './business-pages/management/my-team/student/student-stats/student-stats.component';
import { StudentDetailsComponent } from './business-pages/management/my-team/student/student-details/student-details.component';
import { PermissionsComponent } from './business-pages/settings/permissions/permissions.component';
import { SkillsSelectorV2Component } from './shared/components/skills-selector-v2/skills-selector-v2.component';
import { PermissionsAdvancedFiltersComponent } from './business-pages/settings/permissions/permissions-advanced-filters/permissions-advanced-filters.component';
import { UsersRhythmComponent } from './business-pages/dashboard/users-rhythm/users-rhythm.component';
import { UsersStudyTimeContainerComponent } from './business-pages/dashboard/users-study-time-container/users-study-time-container.component';
import { StudyTimeWeeklyChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-weekly-chart/study-time-weekly-chart.component';
import { StudyTimeMonthlyChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-monthly-chart/study-time-monthly-chart.component';
import { FrequentQuestionsComponent } from './shared/components/frequent-questions/frequent-questions.component';
import { SupportContactComponent } from './shared/components/support-contact/support-contact.component';
import { ProfileSelectorComponent } from './shared/widgets/profile-selector/profile-selector.component';
import { CreateUserComponent } from './business-pages/management/my-team/student/create-user/create-user.component';
import { ProfilesComponent } from './business-pages/management/profiles/profiles.component';
import { NotificationList2Component } from './shared/components/notifications/notification-list2/notification-list2.component';
import { LicenseStudentListComponent } from './shared/components/users/license-student-list/license-student-list.component';
import { QuestionsComponent } from './shared/components/questions/questions.component';
import { StatusSelectorComponent } from './shared/widgets/status-selector/status-selector.component';
import { DialogRequestLicensesComponent } from './shared/components/users/license-student-list/dialog-request-licenses/dialog-request-licenses.component';
import { DialogHistoryLicensesComponent } from './shared/components/users/license-student-list/dialog-history-licenses/dialog-history-licenses.component';

import { StudentInfoFormComponent } from './business-pages/management/my-team/student/student-info-form/student-info-form.component';
import { StudentStudyPlanAndCompetencesComponent } from './business-pages/management/my-team/student/student-study-plan-and-competences/student-study-plan-and-competences.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CustomMonthPipe } from './shared/pipes/custom-month.pipe';
import { SupportComponent } from './shared/components/support/support.component';
import { StudyTimeMonthlyLineChartComponent } from './business-pages/dashboard/users-study-time-container/study-time-monthly-line-chart/study-time-monthly-line-chart.component';
import { DialogDownloadReportComponent } from './shared/components/dialogs/dialog-download-report/dialog-download-report.component';
import { CreateDemoComponent } from './business-pages/create-demo/create-demo.component';
import { IsActivePipe } from './shared/pipes/is-active.pipe';
import { DialogRestorePasswordComponent } from './shared/components/dialogs/dialog-restore-password/dialog-restore-password.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SideNavComponent,
    DashboardComponent,
    StudentListComponent,
    ManagementComponent,
    CoursesComponent,
    ValidationComponent,
    SettingsComponent,
    MyTeamComponent,
    NavigationCardComponent,
    SafePipe,
    CustomDatePipe,
    NavigateBackComponent,
    NotificationsComponent,
    SearchInputBoxComponent,
    StudentComponent,
    SpinnerComponent,
    StudentProfileComponent,
    MainComponent,
    NotificationListComponent,
    CreateCourseComponent,
    AlertComponent,
    DialogConfirmarComponent,
    ExitoComponent,
    InitScriptComponent,
    MyAccountComponent,
    EnterprisePresentationFormComponent,
    EnterpriseInfoFormComponent,
    AdminPresentationFormComponent,
    AdminInfoFormComponent,
    EnterpriseDataComponent,
    AdminDataComponent,
    SkillsSelectorComponent,
    CourseSelectorComponent,
    MembersComponent,
    LicenseComponent,
    PlanCardComponent,
    LicenseDataComponent,
    ValidationListComponent,
    EditValidationTestComponent,
    RankingListComponent,
    TooltipPointsComponent,
    StudyPlanComponent,
    StudentStatsComponent,
    StudentDetailsComponent,
    PermissionsComponent,
    SkillsSelectorV2Component,
    PermissionsAdvancedFiltersComponent,
    UsersRhythmComponent,
    UsersStudyTimeContainerComponent,
    StudyTimeWeeklyChartComponent,
    StudyTimeMonthlyChartComponent,
    SupportContactComponent,
    FrequentQuestionsComponent,
    ProfileSelectorComponent,
    CreateUserComponent,
    ProfilesComponent,
    NotificationList2Component,
    LicenseStudentListComponent,
    QuestionsComponent,
    StatusSelectorComponent,
    DialogRequestLicensesComponent,
    DialogHistoryLicensesComponent,

    StudentInfoFormComponent,
    StudentStudyPlanAndCompetencesComponent,
    CustomMonthPipe,
    SupportComponent,
    StudyTimeMonthlyLineChartComponent,
    DialogDownloadReportComponent,
    CreateDemoComponent,
    IsActivePipe,
    DialogRestorePasswordComponent,
  ],
  imports: [
    BrowserModule,
    NgChartsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgbModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireFunctionsModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonToggleModule, 
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    HttpClientModule,
    NgxExtendedPdfViewerModule,
    DragDropModule,
    MatSlideToggleModule

  ],
  providers: [
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
    VimeoUploadService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
