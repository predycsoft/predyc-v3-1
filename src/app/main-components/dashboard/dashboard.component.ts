import { Component } from '@angular/core';
import jsPDF from 'jspdf';
import { Subscription } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';
import { font, font2 } from 'src/assets/fonts/font-constants';

interface textOpts {
  text: string,
  x: number,
  y: number,
  bold?: boolean,
  size?: number,
  color?: 'white' | 'black',
  textAlign: 'left' | 'center' | 'right',
  maxLineWidth?: number
}

@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise
  users: User[]
  enterpriseSubscription: Subscription
  userServiceSubscription: Subscription

  constructor(
    public loaderService: LoaderService,
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private userService: UserService
  ) {}


  // -----
  totalHours: number
  avgHours: number

  certificatesQty: number
  avgScore: number
  // ----

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
    this.userServiceSubscription = this.userService.users$.subscribe(users => {
      this.users = users
      this.totalHours = 0
      this.certificatesQty = 0
      let accumulatedAvgGrade = 0
      this.users.forEach(user => {
        this.totalHours += user.studyHours
        this.certificatesQty += user.certificatesQty
        accumulatedAvgGrade += user.avgScore
      })
      this.avgHours = this.users.length > 0 ? this.totalHours / this.users.length : 0
      this.avgScore = this.users.length > 0 ? accumulatedAvgGrade / this.users.length : 0
    })
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
  }

  // ********* FOR REPORT *********
  indice = 1
  extraPages = 0
  space = 0
  pageHeigth = 0
  pageWidth = 0
  formattedPageHeigth = 0
  formattedPageWidth = 0
  fin = 0

  font = font
  font2 = font2

  // verticalMargin = 10
  verticalMargin = 5.2
  horizontalMargin = 4.5

  pdf: jsPDF = null



  // ********* Report Methods *********
  async download() {
    try {
      this.indice = 0
      this.extraPages = 0
      this.pdf = new jsPDF("p", "mm", "a4") as jsPDF
      this.space = this.pdf.getCharSpace()
      this.pageHeigth = this.pdf.internal.pageSize.height //297mm
      this.pageWidth = this.pdf.internal.pageSize.width //210mm
      this.formattedPageHeigth = this.pageHeigth - 2*this.verticalMargin //286.6mm
      this.formattedPageWidth = this.pageWidth - 2*this.horizontalMargin //201mm
      this.pdf.setLineHeightFactor(1)
      // this.pdf.setLineWidth(40)
      this.addFonts()
      this.addCover()
      // this.salto(this.pdf)
      // await this.addGeneralPage()
      // for (let index = 0; index < this.pages.length; index++) {
      //   const student = this.pages[index];
      //   await this.studentPage(student, index)
      // }
      this.pdf.save(`Reporte Histórico de ${this.enterprise.name}.pdf`)
    }catch(err) {
      console.log(err)
    }

  }

  logo = "assets/images/logos/logo.png"
  predycBusinessImg = 'assets/images/design/predycBusiness.png';

  addCover() {
    this.pdf.setFillColor(21, 27, 38)
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeigth, 'F')
    const imageAspectRatio = 628/1200 // 1200*628
    const imageXStartingPosition = this.pageWidth/2 - this.pageWidth*0.8/2
    const imageYStartingPosition = (this.pageHeigth/2 - this.pageWidth*0.8*imageAspectRatio/2) - 50
    const imageWidth = this.pageWidth*0.8
    const imageHeight = imageWidth*imageAspectRatio
    this.pdf.addImage(this.predycBusinessImg, 'png', imageXStartingPosition, imageYStartingPosition, imageWidth, imageHeight)
    let currentLine = 220
    const logoWidth = 5
    const logoHeight = 5
    const logoXStartingPosition = (this.formattedPageWidth / 2) - 8
    const logoYStartingPosition = currentLine + this.verticalMargin + this.pdf.getLineHeight()*1/2 - logoHeight
    this.pdf.addImage(this.logo, 'png', logoXStartingPosition , logoYStartingPosition, logoWidth, logoHeight)
    currentLine = this.addFormatedText({
      text: "Predyc",
      x: (this.formattedPageWidth / 2) + (logoWidth/2),
      y: currentLine,
      color: 'white',
      bold: true,
      textAlign: "center"
    })
    currentLine = this.addFormatedText({
      text: "Reporte de capacitación",
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
    currentLine = this.addFormatedText({
      text: this.enterprise.name,
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
    let dateInCoverPage = ""

    dateInCoverPage = "Histórico"
    currentLine = this.addFormatedText({
      text: dateInCoverPage,
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
  }

  addFonts() {
    this.pdf.addFileToVFS("calibri-normal.ttf", this.font)
    this.pdf.addFont("calibri-normal.ttf", "calibri", "normal")
    this.pdf.addFileToVFS("calibri-bold.ttf", this.font2)
    this.pdf.addFont("calibri-bold.ttf", "calibri", "bold")
  }

  addFormatedText(opts: textOpts): number {
    this.pdf.setFont("calibri", opts?.bold ? "bold" : "normal")
    if(opts?.size) {
      this.pdf.setFontSize(opts.size)
    }
    opts.color == 'white' ? this.pdf.setTextColor(255, 255, 255) : this.pdf.setTextColor(0, 0, 0)
    const textLines = this.pdf.splitTextToSize(opts.text, opts?.maxLineWidth ? opts.maxLineWidth : this.formattedPageWidth )
    for (let index=0; index < textLines.length; index++) {
      this.pdf.text(textLines[index], opts.x + this.horizontalMargin, opts.y + this.verticalMargin + this.pdf.getLineHeight()*(index+1)/2, { align: opts.textAlign })
    }
    const nextHeightValue = opts.y + textLines.length * this.pdf.getLineHeight()/2
    return nextHeightValue
  }
}
