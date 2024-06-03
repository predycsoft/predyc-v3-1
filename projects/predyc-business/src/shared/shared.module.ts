import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SideNavComponent } from "./components/sidenav/sidenav.component";
import { NavigationCardComponent } from "./widgets/navigation-card/navigation-card.component";
import { NavigateBackComponent } from "./widgets/navigate-back/navigate-back.component";
import { StudentProfileComponent } from "./components/users/student-profile/student-profile.component";
import { SearchInputBoxComponent } from "./widgets/search-input-box/search-input-box.component";
import { SpinnerComponent } from "./components/spinner/spinner.component";
import { SafePipe } from "./pipes/safe.pipe";
import { CustomDatePipe } from "./pipes/custom-date.pipe";
import { FormatDurationPipe } from "./pipes/format-duration.pipe";
import { NotificationListComponent } from "./components/notifications/notification-list/notification-list.component";
import { AlertComponent } from "./services/dialogs/alert/alert.component";
import { DialogConfirmarComponent } from "./components/dialogs/dialog-confirmar/dialog-confirmar.component";
import { ExitoComponent } from "./components/dialogs/exito/exito.component";
import { VimeoUploadService } from "./services/vimeo-upload.service";
import { InitScriptComponent } from "./components/init-script/init-script.component";
import { SkillsSelectorComponent } from "./components/skills-selector/skills-selector.component";
import { CourseSelectorComponent } from "./components/course-selector/course-selector.component";
import { TooltipPointsComponent } from "./components/tooltip-points/tooltip-points.component";
import { StudyPlanComponent } from "./components/study-plan/study-plan.component";
import { ProfileSelectorComponent } from "./widgets/profile-selector/profile-selector.component";
import { FrequentQuestionsComponent } from "./components/frequent-questions/frequent-questions.component";
import { SkillsSelectorV2Component } from "./components/skills-selector-v2/skills-selector-v2.component";
import { SupportContactComponent } from "./components/support-contact/support-contact.component";
import { LicenseStudentListComponent } from "./components/users/license-student-list/license-student-list.component";
import { QuestionsComponent } from "./components/questions/questions.component";
import { StatusSelectorComponent } from "./widgets/status-selector/status-selector.component";
import { DialogRequestLicensesComponent } from "./components/users/license-student-list/dialog-request-licenses/dialog-request-licenses.component";
import { DialogHistoryLicensesComponent } from "./components/users/license-student-list/dialog-history-licenses/dialog-history-licenses.component";
import { CustomMonthPipe } from "./pipes/custom-month.pipe";
import { SupportComponent } from "./components/support/support.component";
import { DialogDownloadReportComponent } from "./components/dialogs/dialog-download-report/dialog-download-report.component";
import { IsActivePipe } from "./pipes/is-active.pipe";
import { SortSkillsPipe } from "./pipes/sort-skills.pipe";
import { DialogRestorePasswordComponent } from "./components/dialogs/dialog-restore-password/dialog-restore-password.component";
import { StudentListComponent } from "./components/users/student-list/student-list.component";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { HttpClientModule } from "@angular/common/http";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireFunctionsModule } from "@angular/fire/compat/functions";
import { AngularFireStorageModule } from "@angular/fire/compat/storage";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgChartsModule } from "ng2-charts";
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";
import { DialogCreateChargeComponent } from "./components/charges/dialog-create-charge/dialog-create-charge.component";
import { DialogCreateSubscriptionComponent } from "./components/subscription/dialog-create-subscription/dialog-create-subscription.component";
import { DialogEditSubscriptionComponent } from "./components/subscription/dialog-edit-subscription/dialog-edit-subscription.component";
import { DialogStudentEnrolledCourseDetailComponent } from "./components/courses/dialog-student-enrolled-course-detail/dialog-student-enrolled-course-detail.component";
import { MigrationsComponent } from "./components/migrations/migrations.component";
import { DialogCreateLicenseComponent } from "./components/license/dialog-create-license/dialog-create-license.component";
import { DialogEnrollCoursesComponent } from "./components/courses/dialog-enroll-courses/dialog-enroll-courses.component";
import { EnterprisesUsersMigrationComponent } from './components/migrations/enterprises-users-migration/enterprises-users-migration.component';
import { ParticularUsersMigrationComponent } from './components/migrations/particular-users-migration/particular-users-migration.component';
import { StatsCertificationsComponent } from "./components/stats-certifications/stats-certifications.component";
import { CertificationStudentListComponent } from "./components/users/certification-student-list/certification-student-list.component";
import { DialogQuestionsDetailComponent } from './components/questions/dialog-questions-detail/dialog-questions-detail.component';
import { LiveCoursesComponent } from './components/live-courses/live-courses/live-courses.component';
import { LiveCoursesSelectorComponent } from './components/live-courses/live-courses-selector/live-courses-selector.component';
import { CreateLiveCourseComponent } from './components/live-courses/create-live-course/create-live-course.component';
import { DialogEnrollDiplomadosComponent } from "./components/diplomados/dialog-enroll-diplomados/dialog-enroll-diplomados.component";
import { DialogChooseBaseLiveCourseComponent } from './components/live-courses/dialog-choose-base-live-course/dialog-choose-base-live-course.component';
import { CalendarLiveCoursesSelectorComponent } from './components/live-courses/calendar-live-courses-selector/calendar-live-courses-selector.component';
import { ProfileListComponent } from "./components/profiles/student-list/profile-list.component";
import { LiveCourseStudentListComponent } from './components/live-courses/create-live-course/live-course-student-list/live-course-student-list.component';
import { LiveCourseFollowingComponent } from './components/live-courses/create-live-course/live-course-following/live-course-following.component';


@NgModule({
  declarations: [
    SideNavComponent,
    NavigationCardComponent,
    NavigateBackComponent,
    StudentProfileComponent,
    StudentListComponent,
    ProfileListComponent,
    SafePipe,
    CustomDatePipe,
    FormatDurationPipe,
    SearchInputBoxComponent,
    SpinnerComponent,
    NotificationListComponent,
    AlertComponent,
    DialogConfirmarComponent,
    ExitoComponent,
    InitScriptComponent,
    SkillsSelectorComponent,
    CourseSelectorComponent,
    TooltipPointsComponent,
    StudyPlanComponent,
    StatsCertificationsComponent,
    SkillsSelectorV2Component,
    SupportContactComponent,
    FrequentQuestionsComponent,
    ProfileSelectorComponent,
    LicenseStudentListComponent,
    CertificationStudentListComponent,
    QuestionsComponent,
    StatusSelectorComponent,
    DialogRequestLicensesComponent,
    DialogHistoryLicensesComponent,
    CustomMonthPipe,
    SupportComponent,
    DialogDownloadReportComponent,
    IsActivePipe,
    SortSkillsPipe,
    DialogRestorePasswordComponent,
    DialogCreateChargeComponent,
    DialogCreateSubscriptionComponent,
    DialogEditSubscriptionComponent,
    DialogStudentEnrolledCourseDetailComponent,
    MigrationsComponent,
    DialogCreateLicenseComponent,
    DialogEnrollCoursesComponent,
    DialogEnrollDiplomadosComponent,
    EnterprisesUsersMigrationComponent,
    ParticularUsersMigrationComponent,
    DialogQuestionsDetailComponent,
    LiveCoursesComponent,
    LiveCoursesSelectorComponent,
    CreateLiveCourseComponent,
    DialogChooseBaseLiveCourseComponent,
    CalendarLiveCoursesSelectorComponent,
    LiveCourseStudentListComponent,
    LiveCourseFollowingComponent,
  ],
  imports: [
    CommonModule,
    NgChartsModule,
    NgbModule,
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
    MatSnackBarModule,
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
    MatSlideToggleModule,
  ],
  exports: [
    SideNavComponent,
    NavigationCardComponent,
    NavigateBackComponent,
    StudentProfileComponent,
    StudentListComponent,
    ProfileListComponent,
    SafePipe,
    CustomDatePipe,
    FormatDurationPipe,
    SearchInputBoxComponent,
    SpinnerComponent,
    NotificationListComponent,
    AlertComponent,
    DialogConfirmarComponent,
    ExitoComponent,
    InitScriptComponent,
    SkillsSelectorComponent,
    CourseSelectorComponent,
    TooltipPointsComponent,
    StudyPlanComponent,
    StatsCertificationsComponent,
    SkillsSelectorV2Component,
    SupportContactComponent,
    FrequentQuestionsComponent,
    ProfileSelectorComponent,
    LicenseStudentListComponent,
    CertificationStudentListComponent,
    QuestionsComponent,
    StatusSelectorComponent,
    DialogRequestLicensesComponent,
    DialogHistoryLicensesComponent,
    CustomMonthPipe,
    SortSkillsPipe,
    SupportComponent,
    DialogDownloadReportComponent,
    IsActivePipe,
    DialogRestorePasswordComponent,
    NgChartsModule,
    NgbModule,
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
    MatSnackBarModule,
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
    MatSlideToggleModule,
    DialogCreateChargeComponent,
    DialogCreateSubscriptionComponent,
    DialogEditSubscriptionComponent,
    DialogStudentEnrolledCourseDetailComponent,
    MigrationsComponent,
    DialogCreateLicenseComponent,
    LiveCoursesComponent
  ],

  providers: [VimeoUploadService],
})
export class SharedModule {}
