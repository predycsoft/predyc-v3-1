import { Component, Input, SimpleChanges } from '@angular/core';



@Component({
  selector: 'app-instructor-royalties',
  templateUrl: './instructor-royalties.component.html',
  styleUrls: ['./instructor-royalties.component.css']
  
})
export class InstructorRoyaltiesComponent {

  @Input() royaltiesData: any;
  @Input() origen: string = 'admin'



  constructor(

  ) {}


  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.royaltiesData) {

      console.log('royaltiesData',this.royaltiesData)


    }
  }


  ngAfterViewInit() {


  }




  ngOnDestroy() {

  }



}
