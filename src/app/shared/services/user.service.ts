import { Injectable } from '@angular/core';
import { User, UserJson } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { BehaviorSubject, filter, firstValueFrom, map, Observable, Subscription, switchMap } from 'rxjs'
import { Subscription as SubscriptionClass } from 'src/app/shared/models/subscription.model'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { generateSixDigitRandomNumber } from '../utils';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Profile } from '../models/profile.model';
import { ProfileService } from './profile.service';
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
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private enterpriseService: EnterpriseService,
    private profileService: ProfileService,
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
    console.log(newUser)
    const email = newUser.email as string
    const password = `${generateSixDigitRandomNumber()}`
    const { uid } = await firstValueFrom(
      this.fireFunctions.httpsCallable('createUserWithEmailAndPassword')({
        email: email,
        password: password,
      })
    );
    await this.afs.collection(User.collection).doc(uid).set({...newUser.toJson(), uid: uid});
    newUser.uid = uid
    if (newUser.profile) {
      const userRef = this.getUserRefById(uid)
      const profileRef = this.profileService.getProfileRefById(newUser.profile.id)
      await this.profileService.saveUserProfileLog(userRef, profileRef)
    }
  }

  private async activateUser(user: User) {
    await this.afs.collection(User.collection).doc(user.uid as string).set(
      {
        ...user,
        isActive: true
      }, { merge: true }
    );
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
    const userRef = this.getUserRefById(user.uid)
    // Obtener el documento actual
    const currentDocument = await firstValueFrom(this.afs.collection(User.collection).doc(user.uid as string).get())
    const currentData = currentDocument.data() as UserJson;

    await this.afs.collection(User.collection).doc(user.uid as string).set(
      user, { merge: true }
    );
    // Comparar el valor original con el nuevo
    if (user.profile && !currentData.profile || (currentData.profile && currentData.profile.id !== user.profile.id)) {
      console.log("Se cambió el perfil del usuario");
      const profileRef = this.profileService.getProfileRefById(user.profile.id);
      await this.profileService.saveUserProfileLog(userRef, profileRef);
    }
  }

  getUsers$(searchTerm=null, profileFilter=null, statusFilter=null): Observable<User[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef()
        return this.afs.collection<User>(User.collection, ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('enterprise', '==', enterpriseRef)
          query = query.where('isActive', '==', true)
          if (searchTerm) {
            // query = query.where('displayName', '==', searchTerm)
            query = query.where('displayName', '>=', searchTerm).where('displayName', '<=', searchTerm+ '\uf8ff')
          }
          if (profileFilter) {
            const profileRef = this.profileService.getProfileRefById(profileFilter)
            query = query.where('profile', '==', profileRef)
          }
          if (statusFilter && statusFilter === SubscriptionClass.STATUS_ACTIVE) {
            query = query.where('status', '==', SubscriptionClass.STATUS_ACTIVE)
          }
          return query.orderBy('displayName')
        }).valueChanges()
      })
    ) 
  }

  getPerformanceWithDetails(student): { performance:"no plan" | "high" | "medium" | "low", score: number, grade: number } {
    let delayedCourses = 0;
    let delayedMoreThanFiveDays = false;
    let completedCourses = 0;
    let totalScore = 0;
    let totalGrade = 0;
  
    const today = new Date().getTime();
    const studyPlan = student.studyPlan

    studyPlan.forEach((course) => {
      let targetComparisonDate = today
      let delayTime = 0
      let delayDays = 0
      if (course.fechaCompletacion) {
        totalScore += (course.duracion / 60);
        let puntaje = course.puntaje
        totalGrade += puntaje
        completedCourses++;
        if(puntaje >= 80 && puntaje < 90){
          totalScore += (course.duracion / 60)*.1
        }
        if(puntaje >= 90 && puntaje < 100){
          totalScore += (course.duracion / 60)*.3
        }
        if(puntaje == 100){
          totalScore += (course.duracion / 60)*.5
        }
        targetComparisonDate = course.fechaCompletacion
        delayTime = targetComparisonDate - course.fechaFin
        delayDays = delayTime/(24*60*60*1000)
        if (delayDays >= 1) {
          // Delayed course
          delayedCourses++
          if(delayDays < 3){
            // totalScore -= course.duracion*.1
            totalScore -= (course.duracion / 60)*.1
          }
          if(delayDays >= 3 && delayDays < 5){
            // totalScore -= course.duracion*.3
            totalScore -= (course.duracion / 60)*.3
          }
          if(delayDays >= 5){
            delayedMoreThanFiveDays = true
            // totalScore -= course.duracion*.5
            totalScore -= (course.duracion / 60)*.5
          }
        }
      } else if (targetComparisonDate > course.fechaFin) {
        // Not completed and delayed course
        delayedCourses++
        delayTime = targetComparisonDate - course.fechaFin
        delayDays = delayTime/(24*60*60*1000)
        if (delayDays >= 5) {
          delayedMoreThanFiveDays = true
        }
      }
    });
  
    let performance: "no plan" | "high" | "medium" | "low";
    if(studyPlan.length == 0){
      performance ="no plan"
    } else if (delayedCourses === 0) {
      performance = "high";
    } else if (delayedCourses === 1 && !delayedMoreThanFiveDays) {
      // This should be change since every student with at least one delayed course wont be able to get a better performance
      // Maybe this should be calculated as a percentage of every course with a past end date
      performance = "medium";
    } else {
      performance = "low";
    }
  
    const score = totalScore >= 0 ? totalScore: 0;
    const grade = completedCourses > 0 ? totalGrade/completedCourses : 0;
  
    return { performance, score, grade };
  }

  // getActiveUsers$(searchTerm, profileFilter): Observable<User[]> {
  //   return this.getUsers$(searchTerm, profileFilter, true)
  // }

  // getInactiveUsers$(searchTerm, profileFilter): Observable<User[]> {
  //   return this.getUsers$(searchTerm, profileFilter, false)
  // }

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

  async getUserByUid(uid: string): Promise<User> {
    return (await firstValueFrom(this.afs.collection<User>(User.collection).doc(uid).get())).data()
  }

  getUser$(uid: string): Observable<User> {
    return this.afs.collection<User>(User.collection).doc(uid).valueChanges()
  }

  public getUserRefById(id: string): DocumentReference<User> {
    return this.afs.collection<User>(User.collection).doc(id).ref
  }

  public usersAreLoaded(): boolean {
    return this.usersLoadedSubject.value;
  }

  public getUsersByProfile(idProfile: string | null) {
    return this.users$.pipe(
      map(users => 
          users.filter(user => 
              (idProfile === null && user.profile === null) || 
              (user.profile && user.profile.id === idProfile)
          )
      )
    )
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

  async getGeneralUserData(key: string): Promise<User> {
    // Hacer peticion aqui o globalmente cuando se inicie el servicio
    // Crear modelo para nombre de coleccion y documento
    const configData = await firstValueFrom(this.afs.collection("general").doc("config").valueChanges());
    const userRef: DocumentReference = configData[key]
    console.log("general user data", this.getUser(userRef.id))
    return this.getUser(userRef.id)
  }

  async saveStudyPlanHoursPerMonth(uid: string, hoursPerMonth: number) {
    await this.afs.collection(User.collection).doc(uid).set({
      studyHours: hoursPerMonth
    },{merge: true})
  }


  async updateUserFields(uid: string, fields: Partial<User>) {
    await this.afs.collection(User.collection).doc(uid).set(fields, {merge: true});
  }
  

}
