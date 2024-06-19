import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";

import Quill from 'quill';
import BlotFormatter from 'quill-blot-formatter/dist/BlotFormatter';

Quill.register('modules/blotFormatter', BlotFormatter);

@Component({
  selector: "app-article",
  templateUrl: "./article.component.html",
  styleUrls: ["./article.component.css"],
})
export class ArticleComponent {

  constructor(private _afs: AngularFirestore) {}

  test
  format: "object" | "html" | "text" | "json" = "object"
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
  };

  editor: Quill

  public onEditorCreated(editor) {
    this.editor = editor
    console.log(this.editor)
  }

  public debug() {
    console.log("format", this.format)
    console.log("test", this.test)
    console.log("editor", this.editor.getContents())
  }

  public save() {
    this._afs.collection("article").doc().set({data: this.editor.getContents().ops})
  }
}
