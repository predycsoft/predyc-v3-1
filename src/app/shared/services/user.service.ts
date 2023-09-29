import { Injectable } from '@angular/core';
import { User, UserJson } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable, Subscription } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { generateSixDigitRandomNumber } from '../utils';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  private usersLoadedSubject = new BehaviorSubject<boolean>(false)
  public usersLoaded$ = this.usersLoadedSubject.asObservable()

  private userCollectionSubscription: Subscription

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {
    console.log("Se instancio el user service")
    this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseIsLoaded => {
      if (enterpriseIsLoaded) {
        this.getUsers()
      }
    })
  }


  async addUser(newUser: User): Promise<void> {
    try {
      const email = newUser.email as string
      const password = `${generateSixDigitRandomNumber()}`
      const { uid } = await firstValueFrom(
        this.fireFunctions.httpsCallable('createUserWithEmailAndPassword')({
          email: email,
          password: password,
        })
      );
      // const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      // const user = userCredential.user;
      await this.afs.collection(User.collection).doc(uid).set({...newUser.toJson(), uid: uid});
      newUser.uid = uid
      this.alertService.succesAlert('Has agregado un nuevo usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  private async activateUser(user: User) {
    try {
      await this.afs.collection(User.collection).doc(user.uid as string).set(
        {
          ...user,
          isActive: true
        }, { merge: true }
      );
      this.alertService.succesAlert('Has reactivado al usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async delete(user: User): Promise<void> {
    try {
      await this.afs.collection(User.collection).doc(user.uid as string).set(
        {
          ...user,
          isActive: false
        }, { merge: true }
      );
      this.alertService.succesAlert('Has eliminado al usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async transformUserToAdmin(user: User): Promise<void> {
    try {
      await this.afs.collection(User.collection).doc(user.uid as string).set(
        {
          ...user,
          role: 'admin'
        }, { merge: true }
      );
      this.alertService.succesAlert(`El usuario ${user.displayName} ha sido convertido en administrador.`)
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async editUser(user: UserJson): Promise<void> {
    try {
      await this.afs.collection(User.collection).doc(user.uid as string).set(
        user, { merge: true }
      );
      this.alertService.infoAlert('Has editado la informacion del usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  // Arguments could be pageSize, sort, currentPage
  private getUsers() {
    if (this.userCollectionSubscription) {
      this.userCollectionSubscription.unsubscribe();
    }
    this.userCollectionSubscription = this.afs.collection<User>(User.collection, ref => 
      ref
         .where('enterprise', '==', this.enterpriseService.getEnterpriseRef())
         .where('isActive', '==', true)
         .orderBy('displayName')
        //  .limit(pageSize)
    ).valueChanges().subscribe({
      next: users => {
        this.usersSubject.next(users)
        if (!this.usersLoadedSubject.value) {
          this.usersLoadedSubject.next(true)
          console.log("Los usuarios fueron cargados", users)
        }
      },
      error: error => {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
    })
  }

  getUser(uid: string): User {
    // const user = await firstValueFrom(this.afs.collection<User>(User.collection).doc(uid).valueChanges())
    // return user?.enterprise === this.enterpriseService.getEnterpriseRef() ? user : undefined
    return this.usersSubject.value.find(x => x.uid === uid)
  }

  public getUserRefById(id: string): DocumentReference<User> {
    return this.afs.collection<User>(User.collection).doc(id).ref
  }

  public usersAreLoaded(): boolean {
    return this.usersLoadedSubject.value;
  }
}
