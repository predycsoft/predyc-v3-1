import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
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
    return this.afAuth.signInWithEmailAndPassword(email, password)
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
