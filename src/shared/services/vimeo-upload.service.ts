import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, map, throwError, tap, switchMap } from 'rxjs';
import { Enterprise } from '../models/enterprise.model';
import { EnterpriseService } from './enterprise.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class VimeoUploadService {

  private readonly accessToken: string = environment.vimeoAccessToken
  private readonly VIMEO_URL = 'https://api.vimeo.com/me/videos';
  vimeoObsShare: Observable<string>;
  vimeoResult: string;

  private vimeoLink = new BehaviorSubject('');
  vimeoLinkObs = this.vimeoLink.asObservable();

  private loadedSubject = new BehaviorSubject<boolean>(false)
  public loaded$ = this.loadedSubject.asObservable()
  private enterprise: Enterprise

  constructor(
    private http: HttpClient,
    private enterpriseService: EnterpriseService
  ) {
    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (!enterprise) {
        return
      }
      this.enterprise = enterprise
      if (!this.loadedSubject.value) {
        this.loadedSubject.next(true)
      }
    })
  }

  public uploadProgress: number = 0
  public uploading: boolean = false


  // addVideo1(file: File, name: string, description: string): Observable<{vimeoId1: number, vimeoId2: number}> {
  //   return new Observable()
  // }

  // addVideo(file: File, name: string, description: string) {
  //   this.createVideo(name, description).subscribe({
  //     next : response =>{
  //       // Una vez creado el video, sube el archivo
  //       this.uploadProgress = 0
  //       this.uploading = true
  //       this.uploadVideo(file, response.upload.upload_link)
  //       .subscribe({
  //         // Maneja las notificaciones de progreso
  //         next: progress => {
  //           this.uploadProgress = progress-1
  //         },
  //         // Maneja las notificaciones de error
  //         error: error => {
  //           this.uploadProgress = 0;
  //           this.uploading = false;
  //           console.log('Upload Error:', error);
  //         },
  //         // Maneja las notificaciones de completado
  //         complete: () => {
  //           console.log('Upload successful');
  //           this.getProjects().subscribe(projects => {
  //             let projectOperation: Observable<any>;
  //             if (this.enterprise.vimeoFolderId) { // si la empresa sitiene una carpeta
  //               // Si ya existe un proyecto con el nombre del video, agrega el video a él
  //               projectOperation = this.addVideoToProject(this.enterprise.vimeoFolderId, response.uri);
  //             } else {
  //               projectOperation = this.createProject(this.enterprise.name).pipe(
  //                   tap(newProject => { 
  //                     // Aquí es donde actualizamos Firebase
  //                     const projectId = newProject.uri.split('/').pop();
  //                     this.enterpriseService.updateVimeoFolder(this.enterprise, projectId, newProject.uri)
  //                   }),
  //                   switchMap(newProject => this.addVideoToProject(newProject.uri.split('/').pop(), response.uri))
  //               );
  //             }
  //             projectOperation.subscribe({
  //               complete: () => {
  //                 console.log('Video added to Project successfully!');
  //                 this.getVideoData(response.uri).subscribe({
  //                   next: videoData => {
  //                       this.uploadProgress = 100;
  //                       let link = videoData.link;
  //                       link = link.split('/');
  //                       this.uploadResult.next({
  //                         vimeoId1: link[3],
  //                         vimeoId1: link[4]
  //                       })
  //                       // clase.vimeoId1=link[3];
  //                       // clase.vimeoId2=link[4];
  //                       // link[3]
  //                     },
  //                   error: (error) => {
  //                     console.log("error", error);
  //                     this.uploadProgress = 0
  //                     this.uploading = false
  //                   }
  //                 })
  //               },
  //               error: (error)=>{
  //                 console.log("error", error);
  //                 this.uploadProgress = 0
  //                 this.uploading = false
  //               }
  //             })
  //           });
  //         }
  //       });
  //     },
  //     error: (error) => {
  //       console.log("error", error);
  //     }
  //   })
  // }

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

  getProjects(): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    return this.http.get(`https://api.vimeo.com/me/projects`, { headers });
  }

  createProject(projectName: string): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    const body = {
      name: projectName
    };
    return this.http.post('https://api.vimeo.com/me/projects', body, { headers });
  }

  createSubProject(projectName: string,parentUri:string): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    const body = {
      name: projectName,
      parent_folder_uri: parentUri
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
  

  addVideoToProject(projectId: string, videoUri): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    return this.http.put(`https://api.vimeo.com/me/projects/${projectId}${videoUri}`, {}, { headers });
  }

  getVideoData(videoUri: string,): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    return this.http.get(`https://api.vimeo.com${videoUri}`, { headers });
  }

  createVideo(videoName: string = 'Untitled', videoDescription: string = 'No description'): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`
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