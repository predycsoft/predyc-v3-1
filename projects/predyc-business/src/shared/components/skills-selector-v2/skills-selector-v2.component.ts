import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { IconService } from '../../services/icon.service';
import { LoaderService } from '../../services/loader.service';
import { SkillService } from '../../services/skill.service';
import { Category } from 'projects/shared/models/category.model';
import { cloneArrayOfObjects, compareByString } from 'projects/shared/utils';


interface Skill {
  id: string,
  name: string,
  categoryId: string
}

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
  @Input() inputSkills: Skill[]
  @Input() inputCategories
  @Input() arrangeByCategory: boolean
  @Output() onSelectedSkill: EventEmitter<Skill>  = new EventEmitter<Skill>();
  @Output() onRemovedSkill: EventEmitter<Skill>  = new EventEmitter<Skill>();

  skills
  skillsWithoutCategories
  categories

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
    this.skills = cloneArrayOfObjects(this.inputSkills)
    this.selectedSkills.forEach(selectedSkill => {
      const targetSkill = this.skills.find(item => item.id === selectedSkill.id)
      targetSkill["selected"] = true
    })
    if (this.arrangeByCategory) {
      this.skillsWithoutCategories = this.skills.filter(skill => skill.categoryId === null)
      this.categories = this.inputCategories.map(category => {
        return {
          ...category,
          skills: [...this.skills.filter(skill => skill.categoryId === category.id)]
        }
      })
      console.log("this.categories", this.categories)
    } else {
      this.skills = this.skills.sort((a, b) => compareByString(a.name, b.name))
    }
  }

  toggleSkill(skill) {
    skill["selected"] = skill["selected"] ? !skill["selected"] : true
    const skillToEmit: Skill = {
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId
    }
    if (skill["selected"]){
      this.onSelectedSkill.emit(skillToEmit)
    } else {
      this.onRemovedSkill.emit(skillToEmit)
    }
  }

}
