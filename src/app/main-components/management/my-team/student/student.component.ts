import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';

interface Enterprise {
  name: string
  admin: DocumentReference
}

@AfterOnInitResetLoading
@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent implements OnInit {

  student: any
  uid: any

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private loaderService: LoaderService,
    private router: Router,
    private afs: AngularFirestore
  ){}

  async ngOnInit() {
    this.uid = this.route.snapshot.paramMap.get('uid');
    this.student = await this.userService.getUser(this.uid)
    if (!this.student) {
      this.router.navigate(['management/students'])
    }
    // const enterprise = await firstValueFrom(this.afs.collection<Enterprise>('enterprise').valueChanges())
    // const enterprise = await firstValueFrom(this.afs.collection<Enterprise>('enterprise').get())
    // console.log("enterprise")
    // console.log(enterprise)
    // const admin = await enterprise[0].admin.get()
    // const adminData = admin.data()
    // console.log("admin")
    // console.log(adminData)
  } 

}
