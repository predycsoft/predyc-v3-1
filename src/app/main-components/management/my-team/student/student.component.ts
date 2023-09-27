import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent {

  student: any
  uid: any

  loaded = false

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    public loaderService: LoaderService,
    private router: Router,
    private afs: AngularFirestore
  ){}

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.userService.usersLoaded$.subscribe(async isLoaded => {
      if (isLoaded) {
        this.uid = this.route.snapshot.paramMap.get('uid');
        this.student = this.userService.getUser(this.uid)
        this.loaderService.setLoading(false)
        if (!this.student) {
          this.loaded = true
          this.router.navigate(['management/students'])
        }
      }
    })
  } 

}
