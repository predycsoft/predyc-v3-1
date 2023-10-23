import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Profile } from '../models/profile.model';
import { AlertsService } from './alerts.service';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { EnterpriseService } from './enterprise.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private profilesLoaded: Promise<void>
  private profileSubject = new BehaviorSubject<Profile[]>([]);
  private profiles$ = this.profileSubject.asObservable();

  private profilesLoadedSubject = new BehaviorSubject<boolean>(false)
  public profilesLoaded$ = this.profilesLoadedSubject.asObservable();


  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,

  ) {
   }

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
      this.enterpriseRef =this.enterpriseService.getEnterpriseRef()
      this.afs.collection<Profile>(Profile.collection, ref=> ref.where('enterpriseRef', '==', this.enterpriseRef)).valueChanges().subscribe({
        next: profile => {
          this.profileSubject.next(profile)
          if (!this.profilesLoadedSubject.value) {
            this.profilesLoadedSubject.next(true)
            console.log("Los perfiles fueron cargados", profile)
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

  public whenProfilesLoaded(): Promise<void> {
    return this.profilesLoaded;
  }

  public getProfile(id: string):Profile {
    return this.profileSubject.value.find(x => x.id === id)
  }

  public getProfileObject(id: string): Profile {
    return this.profileSubject.value.find(x => x.id === id)
  }

  async saveProfile(profile: Profile): Promise<void> {
    try {
      let ref: DocumentReference;
      console.log('profile save',profile)
      // If profile has an ID, then it's an update
      if (profile.id) {
        ref = this.afs.collection<Profile>(Profile.collection).doc(profile.id).ref;
      } else {
        // Else, it's a new profile
        ref = this.afs.collection<Profile>(Profile.collection).doc().ref;
        profile.id = ref.id; // Assign the generated ID to the profile
      }
      const dataToSave = typeof profile.toJson === 'function' ? profile.toJson() : profile;

      console.log('dataToSave',dataToSave)
      await ref.set(dataToSave, { merge: true });
      profile.id = ref.id; // Assign the generated ID to the profile
      console.log('Operation successful.')
    } catch (error) {
      profile.id = null; // Assign the generated ID to the profile
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  saveUserProfileLog(userRef,ProfileRef){

    let object = {
      userRef:userRef,
      profileRef:ProfileRef,
      updatedAt: new Date()
    }
    let ref: DocumentReference;
    ref = this.afs.collection('userProfile').doc().ref;
    ref.set(object, { merge: true });

  }

  public getProfileRefById(id: string): DocumentReference<Profile> {
    return this.afs.collection<Profile>(Profile.collection).doc(id).ref
  }
  


}
