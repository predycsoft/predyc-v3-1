import { Component, OnInit } from '@angular/core';
// import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'predyc-v3';

  constructor(
    // private afs: AngularFirestore,
  ) {



  }

  ngOnInit() {

    // let test = await firstValueFrom(this.afs.collection('prueba').valueChanges());

    // console.log(test)


    
  }

}
