import { Injectable } from '@angular/core';
import { User, UserJson } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, filter, firstValueFrom, map, Observable, Subscription, switchMap } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { generateSixDigitRandomNumber } from '../utils';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Profile } from '../models/profile.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersSubject = new BehaviorSubject<User[]>([]);
  private usersWithoutProfileSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  public usersWithoutProfile$ = this.usersWithoutProfileSubject.asObservable();
  private usersLoadedSubject = new BehaviorSubject<boolean>(false)
  private usersWithoutProfileLoadedSubject = new BehaviorSubject<boolean>(false)

  public usersLoaded$ = this.usersLoadedSubject.asObservable();
  public usersWithoutProfileLoaded$ = this.usersWithoutProfileLoadedSubject.asObservable();

  private userCollectionSubscription: Subscription
  private userCollectionProfileSubscription: Subscription


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
        this.getUsers();
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
      this.alertService.succesAlert(
        `Has agregado un nuevo ${newUser.role === "admin" ? "administrador" : "usuario"} exitosamente. 
        Hemos enviado un correo para que pueda establecer su contraseña.`
      )
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

  async transformUserToStudent(user: User): Promise<void> {
    try {
      await this.afs.collection(User.collection).doc(user.uid as string).set(
        {
          ...user,
          role: 'student'
        }, { merge: true }
      );
      this.alertService.succesAlert(`El usuario ${user.displayName} ha sido convertido en estudiante.`)
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
    console.log()
    return this.usersSubject.value.find(x => x.uid === uid)
  }

  public getUserRefById(id: string): DocumentReference<User> {
    return this.afs.collection<User>(User.collection).doc(id).ref
  }

  public usersAreLoaded(): boolean {
    return this.usersLoadedSubject.value;
  }

  public getUsersByProfile(idProfile: string | null) {
    // const userRefsFromProfiles: DocumentReference[] = []; // Users of all profiles
    idProfile = "7pHn0t0ue5AYf4ri3eXI"
    let usersOfProvidedProfile: DocumentReference[] = []; // Users of the provided profile

    // profilesSnap.docs.forEach(doc => {
    //     const data = doc.data() as Profile;
    //     if (data.usersRef && Array.isArray(data.usersRef)) {
    //         userRefsFromProfiles.push(...data.usersRef);
    //         if (doc.id === idProfile) {
    //             usersOfProvidedProfile = data.usersRef; // Extract users of the provided profile
    //         }
    //     }
    // });
    // // -----
    // usersOfProvidedProfile = this.getUsersByProfileId(idProfile)
    // const userRefsFromProfiles = this.getUsersWithProfile()
    // console.log("usersOfProvidedProfile", usersOfProvidedProfile)
    // console.log("userRefsFromProfiles", userRefsFromProfiles)
    // -----
    // Convert DocumentReferences to their path strings for easier comparison
    // const userRefPaths = userRefsFromProfiles.map(ref => ref.path);
    // const usersOfProfilePaths = usersOfProvidedProfile.map(ref => ref.path);

    // Step 2: Fetch users based on criteria and exclude/include as required
    return this.users$.pipe(
      map(users => 
          users.filter(user => user.profile.id === idProfile)
      )
  )

    // return this.afs.collection<User>(User.collection, ref =>
    //     ref.where('enterprise', '==', this.enterpriseService.getEnterpriseRef())
    //         .where('isActive', '==', true)
    //         .orderBy('displayName')
    // ).valueChanges({idField: 'id'}).pipe(
    //     map(users => 
    //         users.filter(user => 
    //             !userRefPaths.includes(`user/${user.id}`) || // User is not in any profile
    //             usersOfProfilePaths.includes(`user/${user.id}`)  // User is in the provided profile
    //         )
    //     )
    // );
  }

  getUsersRefByProfileId(profileId: string | null): DocumentReference<User>[] {
    // Filtrar usuarios basados en el profileId y mapear a sus referencias
    const userRefs = this.usersSubject.value
      .filter(user => user.profile && user.profile.path === `${Profile.collection}/${profileId}`)
      .map(user => this.afs.doc<User>(`${User.collection}/${user.uid}`).ref);
    return userRefs;
  }

  getUsersRefsWithProfile(): DocumentReference<User>[] {
    // Filtrar usuarios que tienen un perfil y mapear a sus referencias
    return this.usersSubject.value.filter(user => user.profile).map(user => this.afs.doc<User>(`${User.collection}/${user.uid}`).ref);
}



}
