import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map, switchMap } from 'rxjs';
import { Profile } from '../models/profile.model';
import { AlertsService } from './alerts.service';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { EnterpriseService } from './enterprise.service';
import { Permissions } from 'src/app/shared/models/permissions.model';
import { UserService } from './user.service';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private profilesLoaded: Promise<void>
  private profilesSubject = new BehaviorSubject<Profile[]>([]);
  private profiles$ = this.profilesSubject.asObservable();

  private profilesLoadedSubject = new BehaviorSubject<boolean>(false)
  public profilesLoaded$ = this.profilesLoadedSubject.asObservable();


  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
  ) {}

  public async loadProfiles() {
    this.getProfiles()
    this.profilesLoaded = new Promise<void>((resolve) => {
      this.profiles$.subscribe(async (profile) => {
        if (profile) {
          resolve();
        }
      });
    });
  }

  enterpriseRef

  private getProfiles() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (!isLoaded) {
        return
      }
      this.enterpriseRef = this.enterpriseService.getEnterpriseRef()
      this.afs.collection<Profile>(Profile.collection, ref=> ref.where('enterpriseRef', '==', this.enterpriseRef).orderBy('name')).valueChanges().subscribe({
        next: profile => {
          this.profilesSubject.next(profile)
          if (!this.profilesLoadedSubject.value) {
            this.profilesLoadedSubject.next(true)
          }
        },
        error: error => {
          console.log(error)
          this.alertService.errorAlert(JSON.stringify(error))
        }
      })
    })

  }

  public getProfilesObservable(): Observable<Profile[]> {
    return this.profiles$
  }

  public getProfiles$(): Observable<Profile[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
            
        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs.collection<Profile>(Profile.collection, ref =>
          ref.where('enterpriseRef', '==', enterpriseRef)
        ).valueChanges({ idField: 'id' });
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs.collection<Profile>(Profile.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' });
      
        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty]),
        )
      })
    )
  }

  public whenProfilesLoaded(): Promise<void> {
    return this.profilesLoaded;
  }

  public getProfilesSubjectValue(): Profile[] {
    return this.profilesSubject.value
  }

  public getProfile(id: string):Profile {
    return this.profilesSubject.value.find(x => x.id === id)
  }

  public getProfileObject(id: string): Profile {
    return this.profilesSubject.value.find(x => x.id === id)
  }


  async saveProfile(profile: Profile): Promise<string> {
    let ref: DocumentReference;
    // console.log('profile save',profile)
    // If profile has an ID, then it's an update
    if (profile?.id) {
      ref = this.afs.collection<Profile>(Profile.collection).doc(profile.id).ref;
      const oldProfile = (await ref.get()).data()
      // Si los permisos del perfil cambiaron
      if (JSON.stringify(oldProfile.permissions) !== JSON.stringify(profile.permissions)) {
        const haveSamePermissions = this.checkPermissionsChange(profile.permissions)
        profile.permissions.hasDefaultPermissions = haveSamePermissions
      }
    } else {
      // Else, it's a new profile
      ref = this.afs.collection<Profile>(Profile.collection).doc().ref;
      profile.id = ref.id; // Assign the generated ID to the profile
      const enterprise = this.enterpriseService.getEnterprise()
      profile.permissions = enterprise.permissions
      profile.permissions.hasDefaultPermissions = true
    }
    // profile.permissions.hasDefaultPermissions = hasDefaultPermissions
    const dataToSave = typeof profile.toJson === 'function' ? profile.toJson() : profile;

    await ref.set(dataToSave, { merge: true });
    profile.id = ref.id; // Assign the generated ID to the profile
    return profile.id
  }

  checkPermissionsChange(newPermissions: Permissions): boolean {
    // console.log("oldPermissions", oldPermissions)
    const enterprisePermissions = this.enterpriseService.getEnterprise().permissions
    let haveSamePermissions = true
    const profPermissionsKeys = Object.keys(newPermissions).filter(key => key !== 'hasDefaultPermissions');
    // Comparamos permisos de la empresa y el perfil, sin tomar en cuenta el campo hasDefaultPermissions del perfil
    for (const key of profPermissionsKeys) {
      // Si algun permiso no es igual al de la empresa, entonces no tiene los permisos por defecto
      if (newPermissions[key] !== enterprisePermissions[key]) {
        haveSamePermissions = false;
        console.log(newPermissions[key], enterprisePermissions[key])
        break;
      }
    }
    console.log('haveSamePermissions', haveSamePermissions)
    return haveSamePermissions
  }

  async getUserProfileLogs(userRef: DocumentReference): Promise<any>{
    return await firstValueFrom(this.afs.collection('userProfile', ref => ref
    .where('userRef', '==', userRef).orderBy("updatedAt", "desc")).valueChanges())    
  }
  
  async saveUserProfileLog(userRef: DocumentReference, ProfileRef: DocumentReference){
    let object = {
      userRef: userRef,
      profileRef: ProfileRef,
      updatedAt: new Date()
    }
    let ref: DocumentReference;
    ref = this.afs.collection('userProfile').doc().ref;
    await ref.set(object, { merge: true });
  }

  public getProfileRefById(id: string): DocumentReference<Profile> {
    return this.afs.collection<Profile>(Profile.collection).doc(id).ref
  }

  public getProfile$(uid: string): Observable<Profile> {
    return this.afs.collection<Profile>(Profile.collection).doc(uid).valueChanges()
  }

  public getDiagnosticTestForUser$(user): Observable<any> {
    const userRef = this.afs.collection(User.collection).doc(user.uid).ref
    // console.log(user.uid, user.profile.id)
    return this.afs.collection('profileTestsByStudent', ref => ref.where("userRef", "==", userRef).where("profileRef", "==", user.profile)).valueChanges()
  }
  
}
