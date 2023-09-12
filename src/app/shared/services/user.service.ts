import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private utilsService: UtilsService
  ) {}

  private users: User[] = []

  async addUser(newUser: User): Promise<void> {
    try {
      const email = newUser.email
      const password = `${this.utilsService.capitalizeFirstLetter(newUser.name.replace(' ', ''))}`
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await this.afs.collection('users').doc(user?.uid).set(newUser);
      this.users.push(newUser)
      console.log('User created successfully!');
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;  // Rethrow for handling in the component
    }
  }

  getUsers() {
    return this.users
  }
}
