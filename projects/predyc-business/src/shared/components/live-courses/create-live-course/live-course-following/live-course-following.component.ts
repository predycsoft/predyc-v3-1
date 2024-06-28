import { Component, Input } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LiveCourseService } from 'projects/predyc-business/src/shared/services/live-course.service';
import { LiveCourse } from 'projects/shared/models/live-course.model';
import { Subscription, firstValueFrom } from 'rxjs';

import Quill from "quill";
import BlotFormatter from "quill-blot-formatter/dist/BlotFormatter";
import Swal from "sweetalert2";

const Module = Quill.import("core/module");
const BlockEmbed = Quill.import("blots/block/embed");


class ImageBlot extends BlockEmbed {
  static blotName = "image";
  static tagName = ["figure", "image"];

  static create(value) {
    let node = super.create();
    let img = window.document.createElement("img");
    if (value.alt || value.caption) {
      img.setAttribute("alt", value.alt || value.caption);
    }
    if (value.src || typeof value === "string") {
      img.setAttribute("src", value.src || value);
    }
    node.appendChild(img);
    if (value.caption) {
      let caption = window.document.createElement("figcaption");
      caption.innerHTML = value.caption;
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
    let figcaption = node.querySelector("figcaption");
    if (!img) return false;
    return {
      alt: img.getAttribute("alt"),
      src: img.getAttribute("src"),
      caption: figcaption ? figcaption.innerText : null,
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
  selector: 'app-live-course-following',
  templateUrl: './live-course-following.component.html',
  styleUrls: ['./live-course-following.component.css']
})
export class LiveCourseFollowingComponent {
  

  constructor(
		public icon: IconService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private liveCourseService: LiveCourseService,
  ){}

  @Input() studentEmails: string[] = [];
  @Input() idBaseLiveCourse: string
	@Input() liveCourseId: string

  format: "object" | "html" | "text" | "json" = "object";

  modules = {
    // toolbar: [
    //   ["bold", "italic", "underline", "strike"], // toggled buttons
    //   ["blockquote", "code-block"],
    //   [{ header: 1 }, { header: 2 }], // custom button values
    //   [{ list: "ordered" }, { list: "bullet" }],
    //   [{ script: "sub" }, { script: "super" }], // superscript/subscript
    //   [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    //   [{ direction: "rtl" }], // text direction
    //   [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    //   [{ header: [1, 2, 3, 4, 5, 6, false] }],
    //   [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    //   [{ font: [] }],
    //   [{ align: [] }],
    //   ["clean"], // remove formatting button
    //   ["link", "image", "video"], // link and image, video
    // ],
    // blotFormatter: {}
    cardEditable: true,
  };
  editor: Quill;


  onEditorCreated(editor) {
    this.editor = editor;
    console.log("this.editor", this.editor);
  }


  emailLastDate: string
  emailSent: boolean
  emailContent = ""
  hasBeenAnError = false

  liveCourseServiceSubscription: Subscription

  liveCourse: LiveCourse

  ngOnInit() {
    this.emailSent = false

    this.liveCourseService.getLiveCourseById$(this.liveCourseId).subscribe(liveCourse => {
      if (liveCourse) {
        this.liveCourse = liveCourse
        // console.log("liveCourseSon.emailLastDate", liveCourseSon.emailLastDate)
        this.emailLastDate = this.convertTimestampToDatetimeLocalString(liveCourse.emailLastDate)
      }
    })
  }

  async onSubmit() {
    // console.log("this.studentEmails", this.studentEmails)

    const firma = `
    <p style="margin: 5px 0;">Saludos cordiales,</p>
    <p style="margin: 5px 0; color: #073763;">L.T. Daniela Rodríguez</p>
    <p style="margin: 5px 0;">Coordinadora en Capacitación</p>
    <p style="margin: 5px 0;">Tel: 442 169 2090</p>
    <img src="https://predictiva21.com/wp-content/uploads/2024/06/PbP21-logo-1.webp" alt="Predyc" style="width: 150px; height: auto;">`;    
    const styleMail = `
    <style>
      table {
        max-width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      th {
        background-color: #f2f2f2;
      }
      .high {
        color: green;
      }
      .medium {
        color: orange;
      }
      .low {
        color: red;
      }
      .no-iniciado, .no-plan {
        color: gray;
      }
      .month-row {
        border: none;
        padding-top: 20px;
        font-weight: bold;
      }
      .month-name {
        padding-top: 20px;
        font-weight: bold;
        border: none;
        text-align: left;
      }
    </style>`;
    
    let sender = "capacitacion@predyc.com"
    let recipients = this.studentEmails
    // let recipients = ["diegonegrette42@gmail.com"]
    let subject = `Aviso del curso en vivo ${this.liveCourse.title}`
    let htmlContent = this.editor.root.innerHTML

    htmlContent+=`<br><p><strong>Necesitas ayuda, escribenos</strong></p>
    <p>
      <a href="https://wa.me/524421692090"><img src="https://cdn.icon-icons.com/icons2/3685/PNG/512/whatsapp_logo_icon_229310.png" alt="WhatsApp" style="width: 50px; height: auto;"></a>
    <p>`

    try {
      this.emailSent = true

      const htmlContentFinal = ` <!DOCTYPE html><html><head>${styleMail}</head><body>${htmlContent}${firma}</body></html>`;
      console.log(htmlContentFinal)

      await firstValueFrom(this.fireFunctions.httpsCallable('sendLiveCourseEmail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        htmlContent: htmlContentFinal,
        liveCourseId: this.idBaseLiveCourse,
      }));

      this.emailContent = ""
      console.log("Email enviado")
    } catch (error) {
      console.error("error", error)
      this.emailSent = true
      this.emailContent = ""
      this.hasBeenAnError = true
      this.alertService.errorAlert("")
    }
  }

  
  convertTimestampToDatetimeLocalString(timestamp: any): string {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
  
    // Get the local time components
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // Format the local datetime string in the format required by input[type="datetime-local"]
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  ngOnDestroy() {
    if (this.liveCourseServiceSubscription) this.liveCourseServiceSubscription.unsubscribe()
  }

}
