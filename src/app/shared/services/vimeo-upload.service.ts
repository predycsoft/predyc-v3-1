import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, map, throwError } from 'rxjs';

@Injectable()
export class VimeoUploadService {

  vimeoObsShare: Observable<string>;
  vimeoResult: string;

  private vimeoLink = new BehaviorSubject('');
  vimeoLinkObs = this.vimeoLink.asObservable();

  constructor(private http: HttpClient) { }

  updateVimeoLink(val) {
    this.vimeoLink.next(val);
  }

  createVimeo(options, fileSize): Observable<any> {
    // CUSTOM HEADERS FOR A FIRST INIT CALL
    const initHeaders = new HttpHeaders(
      {
        'Authorization': 'Bearer ' + options.token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    );
    // initHeaders.append('Content-Type', 'application/json');
    // initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
    // CUSTOM INIT BODY
    const initBody = {
      'upload': {
        'approach': 'tus',
        'size': fileSize
      },
      "privacy": {
        "embed": "private"       // public for public video
      },
      'name': options.videoName,
      'description': options.videoDescription
    };
    if (this.vimeoResult) {
      return new Observable<any>(observer => {
        observer.next(this.vimeoResult);
        observer.complete();
      });
    } else if (this.vimeoObsShare) {
      return this.vimeoObsShare;
    } else {
      return this.http.post(options.url, initBody, { headers: initHeaders });
    }
  }

  vimeoUpload(url, file: File): Observable<HttpEvent<any>> {
    const headers = new HttpHeaders({
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': '0',
      'Content-Type': 'application/offset+octet-stream'
    });
    const params = new HttpParams();
    const options = {
      params: params,
      reportProgress: true,
      headers: headers
    };
    const req = new HttpRequest('PATCH', url, file, options);
    return this.http.request(req);
  }

  verifyVimeo(url, file: File) {
    const headers = new HttpHeaders({
      'Tus-Resumable': '1.0.0',
      'Accept': 'application/vnd.vimeo.*+json;version=3.4'
    });

    const params = new HttpParams();
    const options = {
      params: params,
      reportProgress: true,
      headers: headers
    };

    const req = new HttpRequest('HEAD', url, file, options);  //
    return this.http.request(req);

  }


  // nuevas funciones Arturo

  getProjects(access_token: string): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    return this.http.get(`https://api.vimeo.com/me/projects`, { headers });
  }

  createProject(access_token: string, projectName: string): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    const body = {
      name: projectName
    };
    return this.http.post('https://api.vimeo.com/me/projects', body, { headers });
  }

//   createSubProject(access_token: string, parentFolderUri: string, subProjectName: string): Observable<any> {
//     const headers = {
//       'Authorization': `Bearer ${access_token}`,
//       'Content-Type': 'application/json'
//     };
//     const body = {
//       name: subProjectName,
//       parent_folder_uri: parentFolderUri
//     };
//     return this.http.post('https://api.vimeo.com/me/folders', body, { headers });
// }
  

  addVideoToProject(access_token: string, projectId: string, videoUri): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    return this.http.put(`https://api.vimeo.com/me/projects/${projectId}${videoUri}`, {}, { headers });
  }

  getVideoData( access_token: string,videoUri: string,): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    return this.http.get(`https://api.vimeo.com${videoUri}`, { headers });
  }



  private readonly VIMEO_URL = 'https://api.vimeo.com/me/videos';

  createVideo(access_token: string, videoName: string = 'Untitled', videoDescription: string = 'No description'): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
    const body = {
      'name': videoName,
      'description': videoDescription,
      "privacy": {
        "view": "unlisted",
        "embed": "whitelist",
        "download":false
      }
      // "privacy": {
      //   "view": "disable", este este depracado pero es el que sale como oculto de vimeo
      //   "embed": "whitelist"
      // }
    };
    
    return this.http.post(this.VIMEO_URL, body, { headers: headers });
  }

  uploadVideo(file: File, uploadUrl: string): Observable<number> {
    const req = new HttpRequest('PUT', uploadUrl, file, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      // Filtra solo los eventos de progreso de carga
      filter(e => e.type === HttpEventType.UploadProgress),
      // Mapea el evento a un número que representa el porcentaje de carga
      map((event: any) => {
        return Math.round(100 * event.loaded / event.total);
      }),
      // Añade un manejo de errores
      catchError(this.handleError)
    );
  }

    // Añade un manejador de errores
    private handleError(error: HttpErrorResponse) {
      console.error(`An error occurred: ${error.message}`);
      return throwError(() => 'Something went wrong with the upload; please try again later.');
  }




}