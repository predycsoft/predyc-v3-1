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

  // private users: User[] = []


  private users: User[] = []
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  // Necesito ver como valido que el usuario previamente no exista, aunque creo que tirara un error
  async addUser(newUser: User): Promise<void> {
    try {
      const email = newUser.email as string
      const password = `${this.utilsService.generateSixDigitRandomNumber()}`
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      newUser.uid = user?.uid as string
      await this.afs.collection('users').doc(user?.uid).set(newUser.toJson());
      this.users.push(newUser)
      this.usersSubject.next(this.users)
      console.log('User created successfully!');
      this.alertService.succesAlert('Has agregado un nuevo usuario exitosamente.')
    } catch (error) {
      // console.error('Error during signup:', error);
      this.alertService.errorAlert()
      throw error;  // Rethrow for handling in the component
    }
  }

  async delete(user: User): Promise<void> {
    user.isActive = false
    await this.editUser(user, "delete")
    // try {
    //   await this.afs.collection('users').doc(user.uid as string).delete();
    //   const index= this.users.findIndex(x => x.uid === user.uid)
    //   this.users.splice(index, 1)
    //   this.usersSubject.next(this.users)
    //   console.log('User deleted successfully!');
    // } catch (error) {
    //   throw error;
    // }
  }

  async editUser(user: User, mode: ("edit" | "delete")): Promise<void> {
    console.log(user)
    try {
      await this.afs.collection('users').doc(user.uid as string).set(
        user, { merge: true }
      );
      const editText = 'Has editado la informacion del usuario exitosamente.'
      const deleteText = 'Has eliminado al usuario exitosamente.'
      if (mode === "edit") {
        console.log('User edited successfully!');
        this.alertService.infoAlert(editText, 'edit')
      }
      else if (mode === "delete") {
        console.log('User deleted successfully!');
        this.alertService.infoAlert(deleteText, 'delete')
      }
    } catch (error) {
      throw error;
    }
  }

  async getUsers(pageSize: number, sort: string): Promise<void> {
    const users = await firstValueFrom(this.afs.collection<User>('users').valueChanges())
    console.log("users")
    console.log(users)
    this.users = users
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
    // const users = await firstValueFrom(this.afs.collection<User>('users', ref => 
    //   ref.where('enterpriseId', '==', 1)
    //      .where('uid', '==', uid)
    // ).valueChanges())
    // if (users.length > 0) {
    //   return users[0]
    // }
    // return undefined
  }
}
