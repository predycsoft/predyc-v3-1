import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private workers: Worker[] = [];
  private messageSubjects: Subject<number>[] = [];

  constructor(@Inject(DOCUMENT) private document: Document) {
    const hardwareConcurrency = this.document.defaultView.navigator.hardwareConcurrency || 1;

    // Create multiple workers
    for (let i = 0; i < hardwareConcurrency; i++) {
      const worker = new Worker('assets/app.worker.js');      
      const messageSubject = new Subject<number>();

      worker.onmessage = (event) => {
        messageSubject.next(event.data);
      };

      this.workers.push(worker);
      this.messageSubjects.push(messageSubject);

    }
    // console.log("this.workers", this.workers)
  }

  // Post a message to a worker
  postMessage(workerIndex: number, message: any) {
    this.workers[workerIndex].postMessage(message);
  }

  // Observable to listen to messages from a worker
  getMessage(workerIndex: number) {
    return this.messageSubjects[workerIndex].asObservable();
  }
}