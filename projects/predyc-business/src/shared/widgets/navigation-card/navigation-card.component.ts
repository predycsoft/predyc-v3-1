import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navigation-card',
  templateUrl: './navigation-card.component.html',
  styleUrls: ['./navigation-card.component.css']
})
export class NavigationCardComponent {
  @Input() backgroundColor: string = '#EDF8FF'
  @Input() imageUrl: string = 'https://assets-news.housing.com/news/wp-content/uploads/2022/10/19004255/construction-tools-feature-compressed.jpg'
  @Input() title: string = 'Departamentos y perfiles'
  @Input() description: string = 'Organiza tus departamentos, crea perfiles y planes de estudios inteligentes'
  @Input() buttonText: string = 'Ir'
  @Input() buttonColor: string = 'white'
  @Input() buttonBackgroundColor: string = '#008CE3'

  @Output() onBtnClick = new EventEmitter<void>()
}
