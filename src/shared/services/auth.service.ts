import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  subscribeToAuthState() {
    this.afAuth.authState.subscribe(async user => {
      if (user && user.uid) {
        // User logged in
        this.afs.collection<User>(User.collection).doc(user.uid).valueChanges().subscribe(user => {
          this.userSubject.next(user)
        })
        // this.afs.collection<User>(User.collection).doc(user.uid).valueChanges().subscribe(user => {
        //   this.userSubject.next(user)
        // })
      } else {
        // User not logged in
        this.signOutLight()
      }
    })
  }

  async signIn(email: string, password: string) {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, password)
      this.router.navigate(['/'])
    } catch (error: any) {
      const errorCode = error['code'];
      const errorMessage = error['message'];
      if (errorCode === 'auth/wrong-password') {
        throw Error('Wrong password.');
      } else {
        console.log(errorMessage);
      }
    }
  }


  async signOutLight() {
    await this.afAuth.signOut();
    //this.router.navigate(['login'])
    this.userSubject.next(null)
    
  }

  async signOut() {
    await this.afAuth.signOut();
    window.location.reload();   
  }
}
