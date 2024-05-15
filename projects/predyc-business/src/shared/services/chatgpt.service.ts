import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class ChatgptService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

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
}