import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
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
  ) {}

  private users: User[] = []
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  // Necesito ver como valido que el usuario previamente no exista, aunque creo que tirara un error
  async addUser(newUser: User): Promise<void> {
    try {
      try {
        const email = newUser.email as string
        const password = `${this.utilsService.generateSixDigitRandomNumber()}`
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        newUser.uid = user?.uid as string
        console.log("newUser")
        console.log(newUser)
        await this.afs.collection('users').doc(user?.uid).set(newUser.toJson());
      } catch (error) {
        console.log(error)
        if (false) {
          this.activateUser()
        }
        throw error
      }

      this.users.push(newUser)
      this.usersSubject.next(this.users)
      this.alertService.succesAlert('Has agregado un nuevo usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  private async activateUser() {

  }

  async delete(user: User): Promise<void> {
    try {
      await this.afs.collection('users').doc(user.uid as string).set(
        {
          ...user,
          isActive: false
        }, { merge: true }
      );
      const index= this.users.findIndex(x => x.uid === user.uid)
      this.users.splice(index, 1)
      this.usersSubject.next(this.users)
      this.alertService.infoAlert('Has eliminado al usuario exitosamente.', 'delete')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async editUser(user: User): Promise<void> {
    try {
      await this.afs.collection('users').doc(user.uid as string).set(
        user, { merge: true }
      );
      this.alertService.infoAlert('Has editado la informacion del usuario exitosamente.', 'edit')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async getUsers(pageSize: number, sort: string): Promise<void> {
    // const users = await firstValueFrom(this.afs.collection<User>('users', ref => 
    //   ref.where('enterpriseId', '==', this.enterpriseService.enterprise.id)
    //      .where('isActive', '==', true)
    // ).valueChanges())
    const users= await firstValueFrom(this.afs.collection<User>('users').valueChanges())
    console.log("users")
    console.log(users)
    this.users = users
    // console.log(this.users)
    this.usersSubject.next(this.users)
    // const users: User[] = await firstValueFrom(this.afs.collection<User>('user', ref => 
    //   ref.where('enterpriseId', '==', 1)
    //      .orderBy('name')
    //      .limit(pageSize)
    // ).valueChanges());
    // return users ? users : []
  }

  async getUser(uid: string): Promise<User | undefined> {
    const user = await firstValueFrom(this.afs.collection<User>('users').doc(uid).valueChanges())
    return user?.enterpriseId === this.enterpriseService.enterprise.id ? user : undefined
  }
}
