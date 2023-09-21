import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent {

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
  } 

}
