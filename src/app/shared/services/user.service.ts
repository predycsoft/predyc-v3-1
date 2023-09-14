import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private utilsService: UtilsService,
    private enterpriseService: EnterpriseService,
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
    } catch (error) {
      // console.error('Error during signup:', error);
      throw error;  // Rethrow for handling in the component
    }
  }

  async editUser(user: User): Promise<void> {
    console.log(user)
    try {
      await this.afs.collection('users').doc(user.uid as string).set(
        user, { merge: true }
      );
      console.log('User edited successfully!');
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
}
