import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { IconService } from '../../services/icon.service';
import { LoaderService } from '../../services/loader.service';
import { SkillService } from '../../services/skill.service';
import { Skill } from '../../models/skill.model'
import { Category } from '../../models/category.model';
import { compareByString } from '../../utils';

@Component({
  selector: 'app-skills-selector-v2',
  templateUrl: './skills-selector-v2.component.html',
  styleUrls: ['./skills-selector-v2.component.css']
})
export class SkillsSelectorV2Component {

  constructor(
    public icon: IconService,
    public loaderService: LoaderService,
    private categoryService: CategoryService,
    private skillService: SkillService
  ) {}

  @Input() selectedSkills: Skill[]
  @Input() skills: Skill[]
  @Input() categories: Category[]
  @Input() arrangeByCategory: boolean
  @Output() onSelectedSkill: EventEmitter<Skill>  = new EventEmitter<Skill>();
  @Output() onRemovedSkill: EventEmitter<Skill>  = new EventEmitter<Skill>();

  ngOnInit() {
    // console.log("onInit")
    // this.updateData()
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log("changes", changes)
    // if (changes['data']) {
    //   console.log('data input has changed:', changes['data'].currentValue);
    // }
    this.updateData()
    
  }

  updateData() {
    this.selectedSkills.forEach(skill => {
      const targetSkill = this.skills.find(item => item.id === skill.id)
      targetSkill["selected"] = true
    })
    if (this.arrangeByCategory) {
      this.categories.map(category => {
        return {
          ...category,
          skills: [...this.skills.filter(skill => category.id === skill.category.id)]
        }
      })
    } else {
      this.skills = this.skills.sort((a, b) => compareByString(a.name, b.name))
    }
  }

  toggleSkill(skill) {
    skill["selected"] = skill["selected"] ? !skill["selected"] : true
    if (skill["selected"]){
      this.onSelectedSkill.emit(skill)
    } else {
      this.onRemovedSkill.emit(skill)
    }
  }

}
