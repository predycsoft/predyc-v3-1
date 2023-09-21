import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Profile } from '../models/profile.model';
import { AlertsService } from './alerts.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private profilesLoaded: Promise<void>
  private profileSubject = new BehaviorSubject<Profile[]>([]);
  private profiles$ = this.profileSubject.asObservable();

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
  ) {
   }

  public async loadDepartmens() {
    this.getProfiles()
    this.profilesLoaded = new Promise<void>((resolve) => {
      this.profiles$.subscribe(async (profile) => {
        if (profile) {
          resolve();
        }
      });
    });
  }

  private getProfiles() {
    this.afs.collection<Profile>(Profile.collection).valueChanges().subscribe({
      next: profile => {
        this.profileSubject.next(profile)
      },
      error: error => {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
    })
  }

  public getProfilesObservable(): Observable<Profile[]> {
    return this.profiles$
  }

  public whenProfilesLoaded(): Promise<void> {
    return this.profilesLoaded;
  }

  public async getProfile(id: string): Promise<Profile | undefined> {
    return this.profileSubject.value.find(x => x.id === id)
  }


}
