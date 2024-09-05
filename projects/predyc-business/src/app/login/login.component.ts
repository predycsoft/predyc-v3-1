import { Component } from "@angular/core";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { AuthService } from "projects/predyc-business/src/shared/services/auth.service";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { Subscription, firstValueFrom } from "rxjs";
import { User } from "projects/shared/models/user.model";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { DialogRestorePasswordComponent } from "projects/predyc-business/src/shared/components/dialogs/dialog-restore-password/dialog-restore-password.component";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "projects/predyc-business/src/environments/environment";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  form: FormGroup;
  environment = environment;

  constructor(
    private authService: AuthService,
    public icon: IconService,
    private swal: AlertsService,
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,

  ) {}


  queryParamsSubscription: Subscription

  
  ngOnInit() {

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const email = params['email'] || '';

      this.form = this.fb.group({
        email: [email, [Validators.required, Validators.email]],
        password: ["", [Validators.required]],
      });

    })
  

  }

  onSubmit() {
    if (this.form.valid) {
      this.login(this.form.value.email.trim(), this.form.value.password);
    }
  }

  async login(email: string, password: string) {
    const realEmail = email.toLowerCase();
    try {
      const adminUsers = await firstValueFrom(
        this.afs
          .collection<User>(User.collection, (ref) =>
            ref.where("email", "==", realEmail)
            .where("role", "!=", 'student')
          )
          .valueChanges()
      );
      if (adminUsers.length === 0) {
        throw Error(
          `El correo ${realEmail} no existe o no tiene permiso para acceder a la herramienta`
        );
      }
      await this.authService.signIn(realEmail, password);
      // Handle successful login, navigate or update UI
      let  targetRoute = "/";


      console.log(adminUsers[0])


      if( adminUsers[0].isSystemUser){
        targetRoute = "/admin" 
      }
      else if (adminUsers[0].role == 'instructor'){
        targetRoute = "/instructor/questions" 
      }
      else if (adminUsers[0].role == 'crm'){
        targetRoute = "/crm/dashboard" 
      }
        else{
        targetRoute = "/" 
      }

      // alert(targetRoute)

      this.router.navigate([targetRoute]);
    } catch (error) {
      // Handle login error
      const errorCode = error["code"];
      let errorMessage = error["message"];
      if (errorCode === "auth/wrong-password") {
        errorMessage = "Wrong password.";
      }
      console.log(error);
      this.swal.errorAlert(errorMessage as string);
    }
  }

  openForgotPasswordModal() {
    this.dialog.open(DialogRestorePasswordComponent);
  }
}
