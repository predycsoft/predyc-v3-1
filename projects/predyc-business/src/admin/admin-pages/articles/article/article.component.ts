import { Component } from "@angular/core";
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import Quill from "quill";
import BlotFormatter from "quill-blot-formatter/dist/BlotFormatter";
import { Observable, Subscription, combineLatest, firstValueFrom, map, startWith, switchMap, take } from "rxjs";
import Swal from "sweetalert2";
import { ArticleData } from "../articles.component";
import { Author } from "projects/shared/models/author.model";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormControl } from "@angular/forms";
import { Article, ArticleCategoryJson, ArticleJson, ArticleTagJson } from "projects/shared/models/article.model";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { CategoryService } from "projects/predyc-business/src/shared/services/category.service";
import { CategoryJson } from "projects/shared/models/category.model";
import ResizeAction from 'quill-blot-formatter/dist/actions/ResizeAction';
import ImageSpec from 'quill-blot-formatter/dist/specs/ImageSpec';
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { CursoJson } from "projects/shared/models/course.model";

const Module = Quill.import("core/module");
const BlockEmbed = Quill.import("blots/block/embed");

class ImageBlot extends BlockEmbed {
  static blotName = "image";
  static tagName = ["figure", "image"];

  static create(value) {
    // console.log("value", value)
    let node = super.create();
    let img = window.document.createElement("img");

    
    if (value.alt || value.caption) {
      img.setAttribute("alt", value.alt || value.caption);
    }
    if (value.src || typeof value === "string") {
      img.setAttribute("src", value.src || value);
      if (value.src) img.style.display = "block"; img.style.margin = "auto"; // center the images
    }
    if (value.width) {
      img.setAttribute("width", value.width);
    }
    if (value.height) {
      img.setAttribute("height", value.height);
    }
    node.appendChild(img);
    if (value.caption) {
      let caption = window.document.createElement("figcaption");
      caption.innerHTML = value.caption;
      caption.style.textAlign = "center";
      node.appendChild(caption);
    }
    node.className = "ql-card-editable ql-card-figure";
    return node;
  }

  constructor(node) {
    super(node);
    node.__onSelect = () => {
      if (!node.querySelector("input")) {
        let caption = node.querySelector("figcaption");
        let captionInput = window.document.createElement("input");
        captionInput.placeholder = "Type your caption...";
        if (caption) {
          captionInput.value = caption.innerText;
          caption.innerHTML = "";
          caption.appendChild(captionInput);
        } else {
          caption = window.document.createElement("figcaption");
          caption.appendChild(captionInput);
          node.appendChild(caption);
        }
        captionInput.addEventListener("blur", () => {
          let value = captionInput.value;
          if (!value || value === "") {
            caption.remove();
          } else {
            captionInput.remove();
            caption.innerText = value;
          }
        });
        captionInput.focus();
      }
    };
  }

  static value(node) {
    let img = node.querySelector("img");
    // console.log("img", img)
    let figcaption = node.querySelector("figcaption");
    if (!img) return false;

    img.style.display = "block"; img.style.margin = "auto"; // center the images
    if (figcaption) figcaption.style.textAlign = "center" // center the captions

    return {
      alt: img.getAttribute("alt"),
      src: img.getAttribute("src"),
      caption: figcaption ? figcaption.innerText : null,
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
    };
  }
}

class CardEditableModule extends Module {
  constructor(quill, options) {
    super(quill, options);
    let listener = (e) => {
      if (!document.body.contains(quill.root)) {
        return document.body.removeEventListener("click", listener);
      }
      let elm = e.target.closest(".ql-card-editable");
      let deselectCard = () => {
        if (elm.__onDeselect) {
          elm.__onDeselect(quill);
        } else {
          quill.setSelection(quill.getIndex(elm.__blot.blot) + 1, 0, Quill.sources.USER);
        }
      };
      if (elm && elm.__blot && elm.__onSelect) {
        quill.disable();
        elm.__onSelect(quill);
        let handleKeyPress = (e) => {
          if (e.keyCode === 27 || e.keyCode === 13) {
            window.removeEventListener("keypress", handleKeyPress);
            quill.enable(true);
            deselectCard();
          }
        };
        let handleClick = (e) => {
          if (e.which === 1 && !elm.contains(e.target)) {
            window.removeEventListener("click", handleClick);
            quill.enable(true);
            deselectCard();
          }
        };
        window.addEventListener("keypress", handleKeyPress);
        window.addEventListener("click", handleClick);
      }
    };
    quill.emitter.listenDOM("click", document.body, listener);
  }
}

class CustomImageSpec extends ImageSpec {
  getActions() {
    return [ResizeAction]; // Only allow resize (exclude align)
  }
}

Quill.register("modules/blotFormatter", BlotFormatter); //
Quill.register(
  {
    // Other formats or modules
    "formats/image": ImageBlot,
    "modules/cardEditable": CardEditableModule,
    "modules/blotFormatter": BlotFormatter,
  },
  true
);

@Component({
  selector: "app-article",
  templateUrl: "./article.component.html",
  styleUrls: ["./article.component.css"],
})
export class ArticleComponent {
  constructor( private courseService: CourseService, private categoryService: CategoryService, private storage: AngularFireStorage, private authorService: AuthorService, private alertService: AlertsService, private articleService: ArticleService, private modalService: NgbModal, public icon: IconService, private route: ActivatedRoute, public router: Router,private location: Location
  ) {}

  articleId = this.route.snapshot.paramMap.get("articleId");

  format: "object" | "html" | "text" | "json" = "object";
  modules = {
    blotFormatter: {
      specs: [CustomImageSpec],
    },
    cardEditable: true,
  };

  tab = 1
  editor: Quill;

  createTagModal;
  createCategoryModal;
  createPillarModal;

  selectedAuthorId = "";
  articleTags: ArticleTagJson[] = [];
  articleCategories: ArticleCategoryJson[] = [];
  title = "";
  titleSEO = "";
  slug = "";
  pillars: DocumentReference[] = []
  courses: DocumentReference[] = []
  relatedArticles: DocumentReference[] = []
  summary = ""
  metaDescription = ""
  keyWords = ""
  isDraft = false
  isFromPredyc = true;
  orderNumber = 1
  prevOrderNumber: number | null = null

  authors: Author[]

  loadArticleSubscription: Subscription
  articleSubscription: Subscription
  tagsSubscription: Subscription
  categorySubscription: Subscription
  authorSubscription: Subscription
  pillarsSubscription: Subscription
  coursesSubscription: Subscription

  selectedFile: File | null = null;
  pastPreviewImage: string | null = null; //To check if the photo has been changed
  previewImage: string | ArrayBuffer | null = null;

  allTags: ArticleTagJson[] = [];
  tagsForm = new FormControl();
  filteredTags: Observable<any[]>;
  newTagName: string = "";

  allCategories: ArticleCategoryJson[] = [];
  categoriesForm = new FormControl();
  filteredCategories: Observable<ArticleCategoryJson[]>;
  newCategoryName: string = "";

  allCourses: CursoJson[] = [];
  coursesForm = new FormControl();
  filteredCourses: Observable<CursoJson[]>;
  articleCourses: CursoJson[] = [];

  allRelatedArticles: ArticleJson[] = [];
  relatedArticlesForm = new FormControl();
  filteredRelatedArticles: Observable<ArticleJson[]>;
  articleRelatedArticles: ArticleJson[] = [];

  articlePillars: CategoryJson[] = [];
  pillarsForm = new FormControl();
  filteredPillars: Observable<CategoryJson[]>;
  newPillarName: string = '';
  allPillars: CategoryJson[] = [];


  titleMaxLength = 90
  titleSEOMaxLength = 90
  summaryMaxLength = 141
  metaDescriptionMaxLength = 141
  maxOrderNumber: number

  async ngOnInit() {

    this.tagsSubscription = this.articleService.getAllArticleTags$().subscribe(tags => {
      this.allTags = tags;
      this.filteredTags = this.tagsForm.valueChanges.pipe(
        startWith(''),
        map(value => this._filterTags(value))
      );
    });

    this.categorySubscription = this.articleService.getAllArticleCategories$().subscribe(categories => {
      this.allCategories = categories;
      this.filteredCategories = this.categoriesForm.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategories(value))
      );
    });

    this.pillarsSubscription = this.categoryService.getCategoriesObservable().subscribe(pillars => {
      this.allPillars = pillars;
      this.filteredPillars = this.pillarsForm.valueChanges.pipe(
        startWith(''),
        map(value => this._filterPillars(value))
      );
    });

    this.coursesSubscription = this.courseService.getAllCourses$().subscribe(courses => {
      this.allCourses = courses;
      this.filteredCourses = this.coursesForm.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCourses(value))
      );
    });

    this.articleSubscription = this.articleService.getArticles$().subscribe(relatedArticles => {
      this.allRelatedArticles = relatedArticles;
      this.filteredRelatedArticles = this.relatedArticlesForm.valueChanges.pipe(
        startWith(''),
        map(value => this._filterRelatedArticles(value))
      );
    });
    
    this.authorSubscription = this.authorService.getAuthors$().subscribe(authors => {
      this.authors = authors
    })

    this.maxOrderNumber = (await this.articleService.getArticles()).length + 1

  }

  onEditorCreated(editor) {
    this.editor = editor;
    if (this.articleId) this.loadArticle(this.articleId);
    this.preventToolbarScroll();
  }

  loadArticle(articleId: string) {
    try {
      this.loadArticleSubscription = this.articleService.getArticleWithDataById$(articleId).pipe(take(1),
        switchMap((article: ArticleData) => {
          const tagsIds = article.tagsRef.map(x => x.id);
          const pillarsIds = article.pillarsRef.map(x => x.id);
          const coursesIds = article.coursesRef.map(x => x.id);
          const relatedArticlesIds = article.relatedArticlesRef.map(x => x.id);
          const categoriesIds = article.categoriesRef.map(x => x.id);
  
          return combineLatest([
            this.articleService.getArticleTagsByIds$(tagsIds),
            this.categoryService.getCategoriesByIds(pillarsIds),
            this.courseService.getCoursesByIds$(coursesIds),
            this.articleService.getArticlesByIds$(relatedArticlesIds),
            this.articleService.getArticleCategoriesByIds$(categoriesIds),
          ]).pipe(
            map(([tags, pillars, courses, relatedArticles, categories]) => ({
              ...article,
              tags,
              pillars,
              courses,
              relatedArticles,
              categories,
            }))
          );
        })
      ).subscribe(articleWithTagPillarsAndCoursesData => {
        this.selectedAuthorId = articleWithTagPillarsAndCoursesData.authorRef.id;
        this.title = articleWithTagPillarsAndCoursesData.title;
        this.titleSEO = articleWithTagPillarsAndCoursesData.titleSEO;
        this.slug = articleWithTagPillarsAndCoursesData.slug;
        this.previewImage = articleWithTagPillarsAndCoursesData.photoUrl;
        this.pastPreviewImage = articleWithTagPillarsAndCoursesData.photoUrl;
        this.editor.setContents(articleWithTagPillarsAndCoursesData.data);
        this.summary = articleWithTagPillarsAndCoursesData.summary;
        this.metaDescription = articleWithTagPillarsAndCoursesData.metaDescription;
        this.keyWords=articleWithTagPillarsAndCoursesData.keyWords
        this.isDraft = articleWithTagPillarsAndCoursesData.isDraft;
        this.isFromPredyc = articleWithTagPillarsAndCoursesData.isFromPredyc;
        this.orderNumber = articleWithTagPillarsAndCoursesData.orderNumber;
        this.prevOrderNumber = articleWithTagPillarsAndCoursesData.orderNumber;
        this.articleCategories = articleWithTagPillarsAndCoursesData.categories;
        this.articleTags = articleWithTagPillarsAndCoursesData.tags;
        this.articlePillars = articleWithTagPillarsAndCoursesData.pillars; 
        this.articleCourses = articleWithTagPillarsAndCoursesData.courses;
        this.articleRelatedArticles = articleWithTagPillarsAndCoursesData.relatedArticles;
        this.originalContent = structuredClone(articleWithTagPillarsAndCoursesData.data)
        // console.log('originalContent',this.originalContent)
      });
  
    } catch (error) {
      console.error("Error fetching article:", error);
      this.alertService.errorAlert("Error fetching article");
    }
  }

  originalContent = []

  async deleteImages(){
    this.originalContent.forEach(async item => {
      if (item.insert && item.insert.image && item.insert.image?.src!=null) {
        console.log('delete',item)
        await this.deleteImgStorage(item.insert.image.src)
      }
    });
  }

  _filterCategories(value: string | ArticleCategoryJson): ArticleCategoryJson[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.name.toLowerCase();
    return this.allCategories.filter(category => category.name.toLowerCase().includes(filterValue));
  }

  getOptionTextCategory(option: ArticleCategoryJson): string {
    return option ? option.name : '';
  }

  isCategorySelected(category: ArticleCategoryJson): boolean {
    return this.articleCategories.some(selectedCategory => selectedCategory.name === category.name);
  }

  changeCategory(category: ArticleCategoryJson): void {
    if (!this.isCategorySelected(category)) {
      this.articleCategories.push(category);
    }
    this.categoriesForm.setValue('');
  }

  createCategory(modal) {
    this.newCategoryName = "";
    this.createCategoryModal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "sm",
    });
  }

  saveCategory() {
    if (this.newCategoryName) {
      this.articleCategories.push({name: this.newCategoryName, id:null})
      this.allCategories.push({ name: this.newCategoryName, id: null });
      this.categoriesForm.setValue('');
    } 
    this.createCategoryModal.close();
  }

  removeCategory(categoryIndex: number) {
    this.articleCategories.splice(categoryIndex, 1)
  }

  _filterTags(value: string | ArticleTagJson): ArticleTagJson[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.name.toLowerCase();
    return this.allTags.filter(tag => tag.name.toLowerCase().includes(filterValue));
  }

  getOptionTextTag(option: ArticleTagJson): string {
    return option ? option.name : '';
  }

  isTagSelected(tag: ArticleTagJson): boolean {
    return this.articleTags.some(selectedTag => selectedTag.name === tag.name);
  }

  changeTag(tag: ArticleTagJson): void {
    if (!this.isTagSelected(tag)) {
      this.articleTags.push(tag);
    }
    this.tagsForm.setValue(''); // Add the tag to the array but reset the mat form field
  }

  createTag(modal) {
    this.newTagName = "";
    this.createTagModal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "sm",
    });
  }

  saveTag() {
    if (this.newTagName) {
      this.articleTags.push({name: this.newTagName, id:null})
      this.allTags.push({ name: this.newTagName, id: null });
      this.tagsForm.setValue('');
    } 
    this.createTagModal.close();
  }

  removeTag(tagIndex: number) {
    this.articleTags.splice(tagIndex, 1)
  }

  _filterCourses(value: string | CursoJson): any[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.titulo.toLowerCase();
    return this.allCourses.filter(course => course.titulo.toLowerCase().includes(filterValue));
  }

  getOptionTextCourse(option: CursoJson): string {
    return option ? option.titulo : '';
  }

  isCourseSelected(course: CursoJson): boolean {
    return this.articleCourses.some(selectedCourse => selectedCourse.titulo === course.titulo);
  }

  changeCourse(course: CursoJson): void {
    if (!this.isCourseSelected(course)) {
      this.articleCourses.push(course);
    }
    this.coursesForm.setValue(''); // Add the course to the array but reset the mat form field
  }

  removeCourse(courseIndex: number) {
    this.articleCourses.splice(courseIndex, 1);
  }

  _filterRelatedArticles(value: string | ArticleJson): any[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.title.toLowerCase();
    return this.allRelatedArticles.filter(article => article.title.toLowerCase().includes(filterValue));
  }

  getOptionTextRelatedArticle(option: ArticleJson): string {
    return option ? option.title : '';
  }

  isRelatedArticleSelected(article: ArticleJson): boolean {
    return this.articleRelatedArticles.some(selectedArticle => selectedArticle.title === article.title);
  }

  changeRelatedArticle(article: ArticleJson): void {
    if (!this.isRelatedArticleSelected(article)) {
      this.articleRelatedArticles.push(article);
    }
    this.relatedArticlesForm.setValue('');
  }

  removeRelatedArticle(index: number) {
    this.articleRelatedArticles.splice(index, 1);
  }

  _filterPillars(value: string | CategoryJson): CategoryJson[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.name.toLowerCase();
    return this.allPillars.filter(pillar => pillar.name.toLowerCase().includes(filterValue));
  }

  getOptionTextPillar(option: CategoryJson): string {
    return option ? option.name : '';
  }

  isPillarSelected(pillar: CategoryJson): boolean {
    return this.articlePillars.some(selectedPillar => selectedPillar.name === pillar.name);
  }

  navigateBackOrToTarget() {
    this.location.back();
  }

  changePillar(pillar: CategoryJson): void {
    if (!this.isPillarSelected(pillar)) {
      this.articlePillars.push(pillar);
    }
    this.pillarsForm.setValue(''); // Add the pillar to the array but reset the mat form field
  }

  createPillar(modal) {
    this.newPillarName = '';
    this.createPillarModal = this.modalService.open(modal, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size: 'sm',
    });
  }

  savePillar() {
    if (this.newPillarName) {
      const newPillar: CategoryJson = { 
        name: this.newPillarName, 
        id: null, 
        enterprise: null
      };
      this.articlePillars.push(newPillar);
      this.allPillars.push(newPillar);
      this.pillarsForm.setValue('');
    }
    this.createPillarModal.close();
  }

  removePillar(pillarIndex: number) {
    this.articlePillars.splice(pillarIndex, 1);
  }

  setImage(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          const width = image.width;
          const height = image.height;

          const aspectRatio = width / height;
          // const ratioRestriction = 6 / 9
          // const ratioRestriction = 16 / 15 // for 1920px x 1080px
          const ratioRestriction = 1920 / 1080 //1.7778
          const tolerance = 0.01
          console.log("aspectRatio", aspectRatio)
          console.log("ratioRestriction", ratioRestriction)
          if (Math.abs(aspectRatio - ratioRestriction) > tolerance) {
            Swal.fire({
              title: "Error!",
              text: `La imagen debe tener una proporción aproximada de 16:15`,
              icon: "warning",
              confirmButtonColor: "var(--blue-5)",
            });
            return;
          }
  
          this.selectedFile = file;
          this.previewImage = reader.result as string;
        };
      };
    }
  }

  async save() {
    // console.log(this.editor)
    if (!this.checkValidationForm()) this.alertService.errorAlert("Debes llenar todos los campos");
    else {
      Swal.fire({
        title: "Generando artículo...",
        text: "Por favor, espera.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        let downloadURL
        if (this.articleId) { //edit mode
          //Only if image has changed
          if (this.previewImage !== this.pastPreviewImage) downloadURL = await this.uploadImage();
        }
        else downloadURL = await this.uploadImage();

        // First save the new tags and new pillars
        const existingTags = this.articleTags.filter(x => x.id)
        const newTagsToSave = this.articleTags.filter(x => !x.id)
        const newTagsSaved = await this.articleService.saveArticleTags(newTagsToSave)
        this.articleTags = [...existingTags, ...newTagsSaved]
        // console.log("this.articleTags", this.articleTags)

        const existingCategories = this.articleCategories.filter(x => x.id)
        const newCategoriesToSave = this.articleCategories.filter(x => !x.id)
        const newCategoriesSaved = await this.articleService.saveArticleCategories(newCategoriesToSave)
        this.articleCategories = [...existingCategories, ...newCategoriesSaved]
        // console.log("this.articleCategories", this.articleCategories)
        
        const existingPillars = this.articlePillars.filter(x => x.id)
        const newPillarsToSave = this.articlePillars.filter(x => !x.id)
        const newPillarsSaved = await this.categoryService.saveCategories(newPillarsToSave)
        this.articlePillars = [...existingPillars, ...newPillarsSaved]
        // console.log("this.articlePillars", this.articlePillars)
        // Then get the references
        const tagsReferences = this.articleTags.map(x => this.articleService.getArticleTagRefById(x.id))
        const categoriesReferences = this.articleCategories.map(x => this.articleService.getArticleCategoryRefById(x.id))
        const pillarsReferences = this.articlePillars.map(x => this.categoryService.getCategoryRefById(x.id))
        const coursesReferences = this.articleCourses.map(x => this.courseService.getCourseRefById(x.id))
        const relatedArticlesReferences = this.articleRelatedArticles.map(x => this.articleService.getArticleRefById(x.id))

        const processedData = await this.processImagesInContent(this.editor.getContents().ops);
        const processedHtml = this.convertDeltaToHtml(processedData);

        

        await this.deleteImages();


        const dataToSave: ArticleData = {
          authorRef: this.authorService.getAuthorRefById(this.selectedAuthorId),
          categoriesRef: categoriesReferences,
          pillarsRef: pillarsReferences,
          data: processedData,
          dataHTML: processedHtml,
          createdAt: this.articleId ? null : new Date(),
          id: this.articleId ? this.articleId : null,
          tagsRef: tagsReferences,
          title: this.title,
          titleSEO: this.titleSEO,
          summary: this.summary,
          metaDescription: this.metaDescription,
          keyWords:this.keyWords,
          isDraft: this.isDraft,
          isFromPredyc: this.isFromPredyc,
          slug: this.slug,
          updatedAt: new Date(),
          photoUrl: downloadURL,
          orderNumber: this.orderNumber,
          coursesRef: coursesReferences,
          relatedArticlesRef: relatedArticlesReferences,
        };
        console.log("dataToSave",dataToSave)
        const articleId = await this.articleService.saveArticle(dataToSave, !!this.articleId, this.prevOrderNumber);
        this.alertService.succesAlert("El artículo se ha guardado exitosamente");
        if (!this.articleId) this.router.navigate([`admin/articles/edit/${articleId}`]);
        this.loadArticle(this.articleId);
        //Swal.close()
      } catch (error) {
        console.error("Error: ", error);
      }
    }
  }

  convertDeltaToHtml(delta: any): string {
    const quill = new Quill(document.createElement('div'));
    quill.setContents(delta);
    return quill.root.innerHTML;
  }

  async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  }

  preventToolbarScroll() {
    document.querySelectorAll(".ql-picker").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".ql-picker-label").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".ql-picker-options").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".ql-picker-item").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".blot-formatter__overlay").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".blot-formatter__resize-handle").forEach(tool => {
      tool.addEventListener("mousedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".blot-formatter__overlay").forEach(tool => {
      tool.addEventListener("mouseup", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
    document.querySelectorAll(".blot-formatter__resize-handle").forEach(tool => {
      tool.addEventListener("mouseup", function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    });
  }
  

  base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  async deleteImgStorage(url){
    // Eliminar fotos asociadas del Storage
    // console.log('url delete',url)
    try{
      const fileRef = this.storage.refFromURL(url);
      await firstValueFrom(fileRef.delete());
    }
    catch(error){
      console.log('deleteImgStorageError',error)
    }

  }

  async processImagesInContent(content: any[]): Promise<any[]> {
    const newContent = [];
    
    for (const item of content) {

      console.log('processImagesInContentItem',item)
      
      if (item.insert && item.insert.image && (item.insert.image?.src!=null || item.insert.image?.startsWith('data:') )) {
        let blob: Blob;
        
        // Es una imagen en base64
        console.log('item', item);

        if(!item.insert?.image?.src && item.insert.image?.startsWith('data:') ){
          let base64 = item.insert.image
          blob = this.base64ToBlob(base64);
          item.insert.image = null

        }
        else{
          if (item.insert.image?.src?.startsWith('data:')) {
            let base64 = null
            if(item.insert.image?.src?.startsWith('data:') ){
              base64 = item.insert.image.src
            }
            blob = this.base64ToBlob(base64);
          } else {
            // Es una imagen con URL
            blob = await this.urlToBlob(item.insert.image.src);
          }
        }

        
        const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });
        const url = await this.uploadImageArticle(file);
        
        // Crear una nueva imagen con la URL subida
        const newImage = { ...item.insert.image, src: url };
        newContent.push({ ...item, insert: { image: newImage } });
      } else {
        newContent.push(item);
      }
    }
    
    return newContent;
  }

  async uploadImageArticle(image: File): Promise<string> {
    let fileBaseName = image.name.split('.').slice(0, -1).join('.');
    let fileExtension = image.name.split('.').pop();
    let articleTitle = this.title || "Temporal";
    let endName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
    const filePath = `Articulos/${articleTitle}/${endName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, image);

    try {
      await task;
      return await firstValueFrom(fileRef.getDownloadURL());
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      throw new Error('No file selected');
    }

    let fileBaseName = this.selectedFile.name.split('.').slice(0, -1).join('.');
    let fileExtension = this.selectedFile.name.split('.').pop();
    let articleTitle = this.title || "Temporal";
    let endName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
    const filePath = `Articulos/${articleTitle}/${endName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, this.selectedFile);

    try {
      await task;
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  checkValidationForm(): boolean {
    let valid = true;
    if (!this.title) {
      valid = false;
    }
    if (!this.titleSEO) {
      valid = false;
    }
    if (!this.summary) {
      valid = false;
    }
    if (!this.metaDescription) {
      valid = false;
    }
    if (!this.keyWords) {
      valid = false;
    }
    if (!this.selectedAuthorId) {
      valid = false;
    }
    if (this.articleCategories.length === 0) {
      valid = false;
    }
    if (this.articlePillars.length === 0) {
      valid = false;
    }
    if (this.articleTags.length === 0) {
      valid = false;
    }
    if (this.articleCourses.length === 0) {
      valid = false;
    }
    if (!this.previewImage) {
      valid = false;
    }
    if (this.editor.getText().trim().length === 0) {
      valid = false;
    }
    return valid;
  }

  ngOnDestroy() {
    if (this.articleSubscription) this.articleSubscription.unsubscribe()
    if (this.tagsSubscription) this.tagsSubscription.unsubscribe()
    if (this.categorySubscription) this.categorySubscription.unsubscribe()
    if (this.authorSubscription) this.authorSubscription.unsubscribe()
    if (this.pillarsSubscription) this.pillarsSubscription.unsubscribe()
  }

}
