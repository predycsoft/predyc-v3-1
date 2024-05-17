import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { GeneralConfig, GeneralConfigJson } from 'projects/shared/models/general-config.model';

@Injectable({
  providedIn: 'root'
})
export class ChatgptService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private http: HttpClient,
    private afs: AngularFirestore,
  ) {}

  getChatFeatureAllowence$(): Observable<boolean | undefined> {
    return this.afs.collection(GeneralConfig.collection).doc(GeneralConfig.doc).valueChanges()
    .pipe(map((doc: GeneralConfig) => doc?.allowAIChatFeature));
  }

  getChatResponse(prompt: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openAiApiKey}`
    });

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    };

    return this.http.post(this.apiUrl, body, { headers });
  }

  async setAllowAIChatFeature(toActive: boolean) {
    await this.afs.collection(GeneralConfig.collection).doc(GeneralConfig.doc).set({
      allowAIChatFeature: toActive
    }, {merge: true})
  }
}