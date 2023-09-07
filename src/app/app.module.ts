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
import { SafePipe } from './shared/pipes/safe.pipe';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { ManagementDashboardComponent } from './main-components/management/management-dashboard/management-dashboard.component';
import { NavigateBackComponent } from './shared/widgets/navigate-back/navigate-back.component';
import { NewStudentComponent } from './shared/components/users/new-student/new-student.component';
import { MatSelectModule } from '@angular/material/select';

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
    ManagementDashboardComponent,
    NavigateBackComponent,
    NotificationsComponent,
    NewStudentComponent
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

  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
