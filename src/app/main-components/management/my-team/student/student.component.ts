import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/shared/services/user.service';

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
  ){}

  ngOnInit(): void {
    this.uid = this.route.snapshot.paramMap.get('uid');
    this.student = this.userService.getUsers().find(x => x.uid === this.uid)
  } 

}
