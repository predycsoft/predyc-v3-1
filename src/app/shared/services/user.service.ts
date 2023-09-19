import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from '../models/enterprise.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private utilsService: UtilsService,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {
    this.enterpriseService.getEnterpriseObservable().subscribe(enterprise => {
      if (!enterprise) {
        return
      }
      this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(enterprise.id).ref
      this.getUsers()
    })
  }

  private usersSubject = new BehaviorSubject<User[]>([]);
  private users$ = this.usersSubject.asObservable();
  private enterpriseRef: DocumentReference

  async addUser(newUser: User): Promise<void> {
    try {
      try {
        const email = newUser.email as string
        const password = `${this.utilsService.generateSixDigitRandomNumber()}`
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        newUser.uid = user?.uid as string
        await this.afs.collection(User.collection).doc(user?.uid).set(newUser.toJson());
      } catch (error) {
        console.log(error)
        // if (false) {
        //   this.activateUser()
        // }
        throw error
      }
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

  async editUser(user: User): Promise<void> {
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
  getUsers() {
    this.afs.collection<User>(User.collection, ref => 
      ref.where('enterprise', '==', this.enterpriseRef)
         .where('isActive', '==', true)
         .orderBy('displayName')
        //  .limit(pageSize)
    ).valueChanges().subscribe({
      next: users => {
        // console.log(users)
        this.usersSubject.next(users)
      },
      error: error => {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
    })

  }

  async getUser(uid: string): Promise<User | undefined> {
    const user = await firstValueFrom(this.afs.collection<User>(User.collection).doc(uid).valueChanges())
    return user?.enterprise === this.enterpriseRef ? user : undefined
  }

  getUsersObservable(): Observable<User[]> {
    return this.users$
  }
}
