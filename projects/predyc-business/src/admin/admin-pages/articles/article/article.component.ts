import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";

import Quill from "quill";
import BlotFormatter from "quill-blot-formatter/dist/BlotFormatter";

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

// Quill.register("modules/blotFormatter", BlotFormatter);
Quill.register({
  // Other formats or modules
  'formats/image': ImageBlot,
  'modules/cardEditable': CardEditableModule,
  "modules/blotFormatter": BlotFormatter
}, true);

@Component({
  selector: "app-article",
  templateUrl: "./article.component.html",
  styleUrls: ["./article.component.css"],
})
export class ArticleComponent {
  constructor(private _afs: AngularFirestore) {}

  test;
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
    cardEditable: true
  };

  editor: Quill;

  public onEditorCreated(editor) {
    this.editor = editor;
    console.log(this.editor);
  }

  public debug() {
    console.log("format", this.format);
    console.log("test", this.test);
    console.log("editor", this.editor.getContents());
  }

  public save() {
    this._afs.collection("article").doc().set({ data: this.editor.getContents().ops });
  }
}
