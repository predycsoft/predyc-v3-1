import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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



// Components
import { LoginComponent } from './login/login.component';
import { SideNavComponent } from './shared/components/sidenav/sidenav.component';
import { DashboardComponent } from './main-components/dashboard/dashboard.component';
import { StudentListComponent } from './shared/components/users/student-list/student-list.component';
import { ManagementComponent } from './main-components/management/management.component';
import { CoursesComponent } from './main-components/management/courses/courses.component';
import { ValidationComponent } from './main-components/validation/validation.component';
import { SettingsComponent } from './main-components/settings/settings.component';
import { DepartmentsProfilesComponent } from './main-components/management/departments-profiles/departments-profiles.component';
import { MyTeamComponent } from './main-components/management/my-team/my-team.component';
import { NavigationCardComponent } from './shared/widgets/navigation-card/navigation-card.component';
import { VideoDialogComponent } from './main-components/management/management-dashboard/video-dialog/video-dialog.component';
import { NotificationsComponent } from './main-components/management/notifications/notifications.component';
import { ManagementDashboardComponent } from './main-components/management/management-dashboard/management-dashboard.component';
import { NavigateBackComponent } from './shared/widgets/navigate-back/navigate-back.component';
import { StudentProfileComponent } from './shared/components/users/student-profile/student-profile.component';
import { SearchInputBoxComponent } from './shared/widgets/search-input-box/search-input-box.component';
import { StudentComponent } from './main-components/management/my-team/student/student.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { CreateCourseComponent } from './main-components/management/create-course/create-course.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

//
import { SafePipe } from './shared/pipes/safe.pipe';
import { CustomDatePipe } from './shared/pipes/custom-date.pipe';


// Emulators
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/compat/firestore';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/compat/functions';
import { USE_EMULATOR as USE_STORAGE_EMULATOR } from '@angular/fire/compat/storage';
import { MainComponent } from './main-components/main.component';
import { NotificationListComponent } from './shared/components/notifications/notification-list/notification-list.component';
import { AlertComponent } from './shared/services/dialogs/alert/alert.component';
import { DialogConfirmarComponent } from './shared/components/dialogs/dialog-confirmar/dialog-confirmar.component';
import { ExitoComponent } from './shared/components/dialogs/exito/exito.component';
import { VimeoUploadService } from './shared/services/vimeo-upload.service';
import { HttpClientModule } from '@angular/common/http';
import { InitScriptComponent } from './shared/components/init-script/init-script.component';

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
    DepartmentsProfilesComponent,
    MyTeamComponent,
    NavigationCardComponent,
    VideoDialogComponent,
    SafePipe,
    CustomDatePipe,
    ManagementDashboardComponent,
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
    InitScriptComponent
  ],
  imports: [
    BrowserModule,
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
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    HttpClientModule,
    NgxExtendedPdfViewerModule

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
