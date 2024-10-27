import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { robotoBold } from '../../assets/fonts/Roboto/Roboto-bold';
import { robotoRegular } from '../../assets/fonts/Roboto/Roboto-normal';
import Swal from "sweetalert2";
import { startWith } from 'rxjs';


interface textOpts {
    text: string,
    x: number,
    y: number,
    bold?: boolean,
    size?: number,
    color?: 'white' | 'black',
    textAlign: 'left' | 'center' | 'right'|'justify',
    maxLineWidth?: number,
    lineSpacingFactor?: number;  // Nueva propiedad opcional para ajustar el interlineado
    firstLineMaxWidth?:number
    course?:any,
    lastTitle?:string
  }

@Injectable({
  providedIn: 'root'
})
export class PDFService {

    fecha

    constructor() {
      const currentDate = new Date();
      this.fecha = currentDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    
    }

    pageHeigth = 0
    pageWidth = 0
    horizontalMargin = 10
    verticalMargin = 4

    logo ="/assets/images/design/predyc.png"
    logoWhite ="/assets/images/design/PredycWhite.png"
    logoBlack ="/assets/images/design/predyc-logoNegro.png"
    reloj = "assets/iconsUI/clock.png"
    calendar =  "assets/iconsUI/calendar-1.png"
    logoWhiteP21 = "/assets/images/logos/logo-predictiva-blanco-lg.png"
    backPortada = "/assets/images/brosure_Predyc/backPortada.jpg"

    portadasCategories = [
      '/assets/images/brosure_Predyc/back_categoty_1.jpg',
      '/assets/images/brosure_Predyc/back_categoty_2.jpg',
      '/assets/images/brosure_Predyc/back_categoty_3.jpg',
      '/assets/images/brosure_Predyc/back_categoty_4.jpg',
      '/assets/images/brosure_Predyc/back_categoty_5.jpg',
      '/assets/images/brosure_Predyc/back_categoty_6.jpg',
      '/assets/images/brosure_Predyc/back_categoty_7.jpg',
      '/assets/images/brosure_Predyc/back_categoty_8.jpg',
      '/assets/images/brosure_Predyc/back_categoty_9.jpg',
    ]
  
    // Función para convertir imágenes a PNG
    convertImageToPNG(imageUrl: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Evita problemas de CORS
        img.src = imageUrl;
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          canvas.width = img.width;
          canvas.height = img.height;
  
          ctx.drawImage(img, 0, 0);
  
          const imgData = canvas.toDataURL('image/png');
          resolve(imgData);
        };
  
        img.onerror = (error) => {
          reject(error);
        };
      });
    }
  
    // Función para crear una imagen circular usando canvas
    async createCircularImage(imageData: string, diameter: number): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageData;
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = diameter;
          canvas.height = diameter;
  
          // Dibujar el círculo en el canvas
          ctx.beginPath();
          ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
  
          // Dibujar la imagen dentro del círculo
          ctx.drawImage(img, 0, 0, diameter, diameter);
  
          const circularImgData = canvas.toDataURL('image/png');
          resolve(circularImgData);
        };
  
        img.onerror = (error) => {
          reject(error);
        };
      });
    }
    async addFormattedInstructor(instructor:any,startY: number, endY: number, pdf: jsPDF) {
      const sectionHeight = endY - startY;
      const imageSize = 14;
      const textMargin = 3;
      const maxLineWidth = this.pageWidth - 110; // Ajustar el margen derecho
  
      // Convertir la imagen del instructor a base64
      const imageInstrcutorUrl = instructor.foto;
      const imgInstrctorData = await this.convertImageToPNG(imageInstrcutorUrl);
      const circularImage = await this.createCircularImage(imgInstrctorData, 250);
  
      // Añadir la imagen circular al PDF
      pdf.addImage(circularImage, 'PNG', 58.5, startY + (sectionHeight - imageSize) / 2, imageSize, imageSize, '', 'SLOW');
  
      // Calcular la altura del texto
      const instructorName = `Instructor: ${instructor.nombre}`;
      pdf.setFont("Roboto", "bold");
      pdf.setFontSize(9);
      const instructorNameLines = pdf.splitTextToSize(instructorName, maxLineWidth);
      const instructorNameHeight = instructorNameLines.length * pdf.getLineHeight() / 2;
  
      pdf.setFont("Roboto", "normal");
      pdf.setFontSize(6);
      const instructorSummaryLines = pdf.splitTextToSize(instructor.resumen, maxLineWidth);

      const totalLines = instructorNameLines.length + instructorSummaryLines.length; // Calcular el total de líneas
  
      // Mostrar en la consola el total de líneas de texto
      console.log('Total lines of text:', totalLines);
  
      // Calcular la posición vertical del texto para que esté centrado
      const fineTuneOffset = 0; // Ajuste fino de la posición vertical del texto
      const textStartY = startY + ((sectionHeight - (totalLines*2.2)) / 2) + fineTuneOffset;
  
      // Dibujar las líneas de texto del nombre del instructor
      let currentLineYPosition = textStartY;
      pdf.setFont("Roboto", "bold");
      pdf.setTextColor(255, 255, 255);
      instructorNameLines.forEach(line => {
          pdf.text(line, 76, currentLineYPosition, { align: 'left' });
          currentLineYPosition += pdf.getLineHeight() / 2;
      });
  
      // Dibujar las líneas de texto del resumen del instructor
      pdf.setFont("Roboto", "normal");
      instructorSummaryLines.forEach(line => {
          pdf.text(line, 76, currentLineYPosition, { align: 'left' });
          currentLineYPosition += pdf.getLineHeight() / 2;
      });
  
      // // Dibujar líneas horizontales en los márgenes superior e inferior
      // pdf.setDrawColor(200, 200, 200); // Color de la línea
      // pdf.line(0, startY, this.pageWidth, startY); // Línea en el extremo superior
      // pdf.line(0, endY, this.pageWidth, endY); // Línea en el extremo inferior
  }

  async addFormattedInstructorCV(instructor:any,startY: number, endY: number, pdf: jsPDF) {
    const sectionHeight = endY - startY;
    const imageSize = 40;
    const textMargin = 3;
    const maxLineWidth = this.pageWidth - 40; // Ajustar el margen derecho

    // Convertir la imagen del instructor a base64
    const imageInstrcutorUrl = instructor.foto;
    const imgInstrctorData = await this.convertImageToPNG(imageInstrcutorUrl);
    const circularImage = await this.createCircularImage(imgInstrctorData, 250);

    // Añadir la imagen circular al PDF
    pdf.addImage(circularImage, 'PNG', 10, startY + (sectionHeight - imageSize) / 2, imageSize, imageSize, '', 'SLOW');

    // Calcular la altura del texto
    const instructorName = `${instructor.nombre}`;
    pdf.setFont("Roboto", "bold");
    pdf.setFontSize(9);
    const instructorNameLines = pdf.splitTextToSize(instructorName, maxLineWidth);
    const instructorNameHeight = instructorNameLines.length * pdf.getLineHeight() / 2;

    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(14);
    const instructorSummaryLines = pdf.splitTextToSize(instructor.resumen, maxLineWidth);

    const totalLines = instructorNameLines.length + instructorSummaryLines.length; // Calcular el total de líneas

    // Mostrar en la consola el total de líneas de texto
    console.log('Total lines of text:', totalLines);

    // Calcular la posición vertical del texto para que esté centrado
    const fineTuneOffset = -3; // Ajuste fino de la posición vertical del texto
    const textStartY = startY + ((sectionHeight - (totalLines*2.2)) / 2) + fineTuneOffset;

    // Dibujar las líneas de texto del nombre del instructor
    let currentLineYPosition = textStartY;
    pdf.setFont("Roboto", "bold");
    pdf.setTextColor(255, 255, 255);
    instructorNameLines.forEach(line => {
        pdf.text(line, 60, currentLineYPosition, { align: 'left' });
        pdf.setFontSize(10);
        currentLineYPosition += pdf.getLineHeight() / 2;
    });

    // Dibujar las líneas de texto del resumen del instructor
    pdf.setFont("Roboto", "normal");
    instructorSummaryLines.forEach(line => {
        pdf.text(line, 60, currentLineYPosition, { align: 'left' });
        currentLineYPosition += pdf.getLineHeight() / 2;
    });

    // // Dibujar líneas horizontales en los márgenes superior e inferior
    // pdf.setDrawColor(200, 200, 200); // Color de la línea
    // pdf.line(0, startY, this.pageWidth, startY); // Línea en el extremo superior
    // pdf.line(0, endY, this.pageWidth, endY); // Línea en el extremo inferior
}

  meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  formatearFecha(fecha: string): string {
      const [anio, mes, dia] = fecha.split('-');
      // return `${parseInt(dia)} de ${this.meses[parseInt(mes) - 1]} de ${anio}`;
      return `${parseInt(dia)} de ${this.meses[parseInt(mes) - 1]}`;
    }

  isPredyc = true

  async downloadFichaTecnica(course, instructor, pdf: jsPDF = null, addToDocument: boolean = false,isPredyc = true) {
    this.isPredyc = isPredyc
    if (!pdf) {
      pdf = new jsPDF("p", "mm", "a4", true) as jsPDF;
  
      pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
      pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
      pdf.addFileToVFS("Roboto-Bold.ttf", robotoBold);
      pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    }
  
    this.pageHeigth = pdf.internal.pageSize.height; //297mm
    this.pageWidth = pdf.internal.pageSize.width; //210mm
    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, this.pageWidth, 55, 'F');
    let currentLine = 0;
  
    const imageUrl = course.imagen;
    const imgData = await this.convertImageToPNG(imageUrl);
  
    pdf.addImage(imgData, 'PNG', 6, 5, 45, 45, '', 'SLOW');
  
    const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
    const imgHeight = imgWidth / 4.65517241379;
  
    // Agregar nombre del curso y logo en la esquina inferior derecha
    const posY = this.pageHeigth - imgHeight - 5;
    let courseTitle = course.titulo;
  
    pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
    pdf.setFont("Roboto", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
    pdf.setFontSize(9);  // Ajustar el tamaño de la fuente

    let textoEmpresa = 'Predyc'
    let margen = 20
    if(!isPredyc){
      textoEmpresa = 'Predictiva21'
      margen = 25
    }
    pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });
  
    const imgWidtLogoWhite = 27;  // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;
    
    if(isPredyc){
      pdf.addImage(this.logoWhite, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
    }
    else{
      //logo predicti21
      pdf.addImage(this.logoWhiteP21, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
    }
  
    pdf.setFontSize(18);
    currentLine = this.addFormatedText({
      text: courseTitle,
      course: course,
      x: 48,
      y: -2,
      color: 'white',
      bold: true,
      size: 18,
      textAlign: "left",
      maxLineWidth: this.pageWidth - 20,
      firstLineMaxWidth: this.pageWidth - 95,
      lineSpacingFactor: 0.8
    }, pdf);
  
    const instructorSectionStartY = currentLine + 4;
    const instructorSectionEndY = 45.5;
  
    await this.addFormattedInstructor(instructor, instructorSectionStartY, instructorSectionEndY, pdf);
  
    pdf.setFontSize(17);
  
    let duracionCurso = this.getFormattedDuration(course.duracion);
    
  
    pdf.addImage(this.reloj, 'png', 57.69, 45.02, 6, 6, '', 'SLOW');

    let txtDuracion = `Duración del curso: ${duracionCurso}`

    if(course.modalidad){
      txtDuracion = `${course.modalidad} | ${txtDuracion}`
    }

  
    currentLine = this.addFormatedText({
      text: `${txtDuracion}`,
      course: course,
      x: 55,
      y: 40.5,
      size: 8,
      color: 'white',
      bold: true,
      textAlign: "left",
      maxLineWidth: this.pageWidth - 120
    }, pdf);

    if(course.fechaInicio){
      let txtFecha = this.formatearFecha(course.fechaInicio)
      pdf.addImage(this.calendar, 'png', 150, 45.02, 6, 6, '', 'SLOW');
      currentLine = this.addFormatedText({
        text: `Fecha de inicio: ${txtFecha}`,
        course: course,
        x: 148,
        y: 40.5,
        size: 8,
        color: 'white',
        bold: true,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 120
      }, pdf);


    }


  
    pdf.setFontSize(16);
  
    pdf.setFontSize(14);
    currentLine = 53;
    currentLine = this._addFormatedText({
      text: "Descripción del curso",
      course: course,
      x: 0,
      y: currentLine,
      size: 11,
      color: 'black',
      bold: true,
      textAlign: "left"
    }, pdf);
  
    pdf.setFontSize(10);
    currentLine = this._addFormatedText({
      text: course.descripcion,
      course: course,
      x: 0,
      y: currentLine + 3,
      size: 8,
      color: 'black',
      bold: false,
      textAlign: "left"
    }, pdf);
    pdf.setFontSize(14);

    pdf.setFontSize(14);

    currentLine = this.addFormatedText({
      text: "Contenido del curso",
      course: course,
      x: 0,
      size: 11,
      y: currentLine + 3,
      color: 'black',
      bold: true,
      textAlign: "left"
    }, pdf);
    pdf.setFontSize(10);
    currentLine = currentLine + 10;
    currentLine = await this.addFormattedTable(course, currentLine, pdf,isPredyc);


    if(course.fechaInicio){

      currentLine = currentLine + 1;
      currentLine = this._addFormatedText({
        text: "Sesiones",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      // currentLine = this._addFormatedText({
      //   text: this.formatearFecha(course.fechaInicio),
      //   course: course,
      //   x: 0,
      //   y: currentLine + 3,
      //   size: 8,
      //   color: 'black',
      //   bold: false,
      //   textAlign: "left"
      // }, pdf);

      currentLine = currentLine + 3;


      if(course.fehcaSesiones){
        currentLine = this._addFormatedText({
          text: course.fehcaSesiones,
          course: course,
          x: 0,
          y: currentLine,
          size: 8,
          color: 'black',
          bold: false,
          textAlign: "left"
        }, pdf);
      }

    }

    if(course.descuentos){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Descuentos",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: course.descuentos,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    

    if(course.aQuienVaDirigido){

      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "A quién va dirigido",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: course.aQuienVaDirigido,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);


    }

    if(course?.objetivos?.length>0){

      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Objetivos",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);


      console.log('objetivos',course.objetivos)

      course?.objetivos?.forEach(objetivo => {

        let texto = ''
        if(objetivo?.titulo?.trim()){
          texto += `${objetivo.titulo.trim()}: `
        }
        texto += `${objetivo.descripcion.trim()}`

        pdf.setFontSize(10);
        currentLine = this._addFormatedText({
          text: `*${texto}`,
          course: course,
          x: 0,
          y: currentLine+3,
          size: 8,
          color: 'black',
          bold: false,
          textAlign: "left"
        }, pdf);
      

      });

    }

    if(course.queIncluye){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;


      currentLine = this._addFormatedText({
        text: "Qué incluye",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: course.queIncluye,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }


    if(!isPredyc){
      await this.addInstrcutorCV(pdf,course,instructor,isPredyc)
    }
  
    if (!addToDocument) {
      pdf.save("Ficha_tecnica_Curso_" + this.sanitizeFilename(course.titulo) + ".pdf");
    }
  }

  async addCategoryPage(category,pdf,isPredyc){
    
    pdf.addPage();


    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, this.pageWidth, 55, 'F');
    let currentLine = 0;
  
  
    const imgWidth = 30;
    const imgHeight = imgWidth / 4.65517241379;
  
    const posY = this.pageHeigth - imgHeight - 5;
    let courseTitle = category.name;
  
    pdf.setFontSize(8);
    pdf.setFont("Roboto", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
    pdf.setFontSize(9);

    let textoEmpresa = 'Predyc'
    let margen = 20
    if(!isPredyc){
      textoEmpresa = 'Predictiva21'
      margen = 25
    }
    pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });
    
  
    const imgWidtLogoWhite = 27;
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;

    if(isPredyc){
      pdf.addImage(this.logoWhite, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
    }
    else{
      pdf.addImage(this.logoWhiteP21, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');      
    }

  }



  async addInstrcutorCV(pdf,course,instructor,isPredyc){

    console.log(pdf,instructor)
    
    pdf.addPage();

    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, this.pageWidth, 55, 'F');
    let currentLine = 0;
  
    const imageUrl = instructor.foto;
    const imgData = await this.convertImageToPNG(imageUrl);
  
    //pdf.addImage(imgData, 'PNG', 6, 5, 45, 45, '', 'SLOW');
  
    const imgWidth = 30;
    const imgHeight = imgWidth / 4.65517241379;
  
    const posY = this.pageHeigth - imgHeight - 5;
    let courseTitle = course.titulo;
  
    pdf.setFontSize(8);
    pdf.setFont("Roboto", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
    pdf.setFontSize(9);

    let textoEmpresa = 'Predyc'
    let margen = 20
    if(!isPredyc){
      textoEmpresa = 'Predictiva21'
      margen = 25
    }
    pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });
    
  
    const imgWidtLogoWhite = 27;
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;


    pdf.setFontSize(18);

    const instructorSectionStartY = 0;
    const instructorSectionEndY = 55;

    if(isPredyc){
      pdf.addImage(this.logoWhite, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
    }
    else{
      pdf.addImage(this.logoWhiteP21, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');      
    }
  
    await this.addFormattedInstructorCV(instructor, instructorSectionStartY, instructorSectionEndY, pdf);

    currentLine = 55

    if(instructor?.resumenCV){
      currentLine = this.addFormatedText({
        text: instructor.resumenCV,
        course: null,
        x: 0,
        size: 8,
        y: currentLine + 3,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);
    }

    if(instructor.formacion){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Formación",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: instructor.formacion,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    if(instructor.experienciaLaboral){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Experiencia profesional",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: instructor.experienciaLaboral,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    if(instructor.destrezas){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Destrezas",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: instructor.destrezas,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    if(instructor.certificacion){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Certificaciones",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: instructor.certificacion,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    //certificacion

    if(instructor.cursosConferenciasYtrabajos){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;
      currentLine = this._addFormatedText({
        text: "Cursos, conferencias y trabajos",
        course: course,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText({
        text: instructor.cursosConferenciasYtrabajos,
        course: course,
        x: 0,
        y: currentLine + 3,
        size: 8,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }




  }

  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
    });
  }



  async addTableOfContent(pdf: jsPDF, categories,isPredyc = true) {

    // Definimos el color como una tupla para TypeScript
    const headerColor: [number, number, number] = [35, 43, 56];

    // Añadir una nueva página
    pdf.addPage();

    // Establecer el color de relleno para el encabezado
    pdf.setFillColor(...headerColor);

    // Dibujar el rectángulo de color en la parte superior con altura variable (por ejemplo, 55)
    const headerHeight = 20; // Ajusta esta altura según tus necesidades
    pdf.rect(0, 0, this.pageWidth, headerHeight, 'F'); 

    // Establecer el color de texto y tamaño de fuente para el encabezado
    pdf.setTextColor(255, 255, 255); // Color de texto blanco

    const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
    const imgHeight = imgWidth / 4.65517241379;
  
    // Agregar nombre del curso y logo en la esquina inferior derecha
    const posY = this.pageHeigth - imgHeight - 5;
    let courseTitle = 'Tabla de contenido';
  
    pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
    pdf.setFont("Roboto", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
    pdf.setFontSize(9);  // Ajustar el tamaño de la fuente

    let textoEmpresa = 'Predyc'
    let margen = 20
    if(!isPredyc){
      textoEmpresa = 'Predictiva21'
      margen = 25
    }
    pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });

    const imgWidtLogoWhite = 27;  // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;
    
    if(isPredyc){
      pdf.addImage(this.logoWhite, 'png', 180, 7, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
    }

    let currentLine = 0
    pdf.setFontSize(18);
    currentLine = this.addFormatedText({
      text: courseTitle,
      course: null,
      x: 0,
      y: -1,
      color: 'white',
      bold: true,
      size: 20,
      textAlign: "left",
      maxLineWidth: this.pageWidth - 20,
      firstLineMaxWidth: this.pageWidth - 90,
      lineSpacingFactor: 0.8
    }, pdf);


    pdf.setFontSize(14);

    currentLine = 30


    for (let i = 0; i < categories.length; i++) {

      let category = categories[i]
      // currentLine = this.addFormatedText({
      //   text: `Cursos de ${category.name}`,
      //   course: null,
      //   x: 0,
      //   size: 11,
      //   y: currentLine + 3,
      //   color: 'black',
      //   bold: true,
      //   textAlign: "left"
      // }, pdf);

      const courses = category.courses
        let modulo = [{
          titulo:category.name,
          clases:courses
        }]

        let table ={
          titulo:courseTitle,
          modules:modulo
        }

      currentLine = currentLine+4
      console.log('table',table)
      currentLine = await this.addFormattedTable(table, currentLine, pdf,isPredyc,true);

    }




  

 }

  async addcategoryTable(pdf: jsPDF, category: any,index,courses,isPredyc = true) {

     // Definimos el color como una tupla para TypeScript
     const headerColor: [number, number, number] = [35, 43, 56];

     // Añadir una nueva página
     pdf.addPage();

     // Establecer el color de relleno para el encabezado
     pdf.setFillColor(...headerColor);

     // Dibujar el rectángulo de color en la parte superior con altura variable (por ejemplo, 55)
     const headerHeight = 20; // Ajusta esta altura según tus necesidades
     pdf.rect(0, 0, this.pageWidth, headerHeight, 'F'); 

     // Establecer el color de texto y tamaño de fuente para el encabezado
     pdf.setTextColor(255, 255, 255); // Color de texto blanco

     const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
     const imgHeight = imgWidth / 4.65517241379;
   
     // Agregar nombre del curso y logo en la esquina inferior derecha
     const posY = this.pageHeigth - imgHeight - 5;
     let courseTitle = category.name;
   
     pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
     pdf.setFont("Roboto", "normal");
     pdf.setTextColor(0, 0, 0);
     pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
     pdf.setFontSize(9);  // Ajustar el tamaño de la fuente
 
     let textoEmpresa = 'Predyc'
     let margen = 20
     if(!isPredyc){
       textoEmpresa = 'Predictiva21'
       margen = 25
     }
     pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });

     const imgWidtLogoWhite = 27;  // Puedes ajustar este valor según tus necesidades
     const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;
     
     if(isPredyc){
       pdf.addImage(this.logoWhite, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');
     }

     let currentLine = 0
     pdf.setFontSize(18);
     currentLine = this.addFormatedText({
       text: courseTitle,
       course: null,
       x: 0,
       y: -1,
       color: 'white',
       bold: true,
       size: 20,
       textAlign: "left",
       maxLineWidth: this.pageWidth - 20,
       firstLineMaxWidth: this.pageWidth - 90,
       lineSpacingFactor: 0.8
     }, pdf);


     pdf.setFontSize(14);

     currentLine = 20

     currentLine = this.addFormatedText({
       text: "Cursos del pilar",
       course: null,
       x: 0,
       size: 11,
       y: currentLine + 3,
       color: 'black',
       bold: true,
       textAlign: "left"
     }, pdf);


     let modulo = [{
       titulo:category.name,
       clases:courses
     }]

     let table ={
       modules:modulo
     }

     currentLine = currentLine+10
   

     currentLine = await this.addFormattedTable(table, currentLine, pdf,isPredyc,true);
  }

  async addCategoryCover(pdf: jsPDF, category: any,index) {

    pdf.addPage(); // HOJA PORTADA PILAR

    // Agregar la imagen de fondo de la portada
    pdf.addImage(this.portadasCategories[index], 'JPG', 0, 0, 210, 297, '', 'SLOW');

    // Configuración del texto
    pdf.setFont("Roboto", "bold");
    pdf.setFontSize(50);
    pdf.setTextColor(255, 255, 255); // Ajustar color si es necesario

    // Calcular las posiciones centrales de la página
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth * 0.8; // Ancho máximo para el texto (80% del ancho de la página)
    
    // Dividir el texto en líneas según el ancho máximo permitido
    const lines = pdf.splitTextToSize(category.name, maxLineWidth);
    const lineHeight = pdf.getTextDimensions("M").h * 1.1; // Obtener altura de línea con factor de espaciado
    const totalTextHeight = lines.length * lineHeight;
    
    // Posicionar el texto centrado
    const textX = pageWidth / 2;
    const textY = ((pageHeight / 2) - (totalTextHeight / 2))+15;

    lines.forEach((line, index) => {
        pdf.text(line, textX, textY + (index * lineHeight), { align: 'center' });
    });

    // Configuración del logo
    const logoPath = '/assets/images/brosure_Predyc/logoWhite.png';
    const logoWidth = 50; // Ancho deseado del logo
    const logoMarginTop = - 10; // Margen superior del logo desde el texto

    // Cargar la imagen
    const image = await this.loadImage(logoPath);
    
    // Mantener la relación de aspecto del logo
    const aspectRatio = image.width / image.height;
    const logoHeight = logoWidth / aspectRatio;

    // Posición del logo justo debajo del texto
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = textY + totalTextHeight + logoMarginTop;

    // Añadir el logo al PDF
    pdf.addImage(image, 'PNG', logoX, logoY, logoWidth, logoHeight);
  }

  


  async downloadCatalogCourses(categories,titulo='Ficha_tecnica_Cursos',showLoading = true,isPredyc = true,idAdmin = true) {

    let categoriesPDF = []
    if(idAdmin){
      console.log('categories',categories) 
      categories = categories.filter(x=>x.enterprise == null && x.coursesPredyc?.length>0)
      categories = categories.sort((a, b) => {
       return a.order - b.order;
       });
   
       categories.forEach(category => {
        let categoryToPush ={
          name:category.name,
          courses:category.coursesPredyc.filter(x=>!x.proximamente)
        }
        categoriesPDF.push(categoryToPush)
       });
    }
    else{

    }

    //categoriesPDF = categoriesPDF.splice(1,8)

    console.log('categoriesPDF',categoriesPDF)

    if(showLoading){
      Swal.fire({
        title: "Generando documento...",
        text: "Por favor, espera.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    const pdf = new jsPDF("p", "mm", "a4", true) as jsPDF;
  
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
    pdf.addFileToVFS("Roboto-Bold.ttf", robotoBold);
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    // incio portada general

    pdf.addImage(this.backPortada, 'JPG', 0, 0, 210, 297,'','SLOW')

    // 'CURSOS PREDYC'

    // Configuración del texto
    pdf.setFont("Roboto", "bold");
    pdf.setFontSize(58);
    pdf.setTextColor(255, 255, 255);

    // Calcular las posiciones centrales de la página
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    this.pageHeigth= pageHeight
    this.pageWidth = pageWidth
    const textX = pageWidth / 2;
    const textY = pageHeight / 2;

    // Dibujar el texto centrado
    pdf.text('CURSOS', textX, textY - 12, { align: 'center' }); // Ajuste vertical para "CURSOS"
    pdf.setFontSize(56);
    pdf.text('PREDYC', textX, textY + 10, { align: 'center' }); // Ajuste vertical para "PREDYC"

    // assets/images/brosure_Predyc/logoBlack.png

    // Configuración del logo
  const logoPath = 'assets/images/brosure_Predyc/logoBlack.png';
  const logoWidth = 50; // Ajusta el ancho del logo como desees
  const logoMarginBottom = 10; // Margen desde el borde inferior de la página

  const image = await this.loadImage(logoPath);
        
  // Mantener la relación de aspecto
  const aspectRatio = image.width / image.height;
  const logoHeight = logoWidth / aspectRatio;

  // Posición centrada en la parte inferior
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = pageHeight - logoHeight - logoMarginBottom;

  // Añadir el logo al PDF
  pdf.addImage(image, 'PNG', logoX, logoY, logoWidth, logoHeight);


    // fin portada general
    // for (let i = 0; i < categoriesPDF.length; i++) {
    //   const category = categoriesPDF[i];
    //   const courses = category.courses.sort((a, b) => {
    //     return a.titulo - b.titulo;
    //     });

    //   await this.addcategoryTable(pdf,category,i,courses,true)
    // }

    await this.addTableOfContent(pdf,categoriesPDF,true)

    for (let i = 0; i < categoriesPDF.length; i++) {


      const category = categoriesPDF[i];
      const courses = category.courses.sort((a, b) => {
        return a.titulo - b.titulo;
        });

      // incio portada pilar

      await this.addCategoryCover(pdf, category,i)  
      //await this.addcategoryTable(pdf,category,i,courses,true)


      // incio pilar tabla cursos

      pdf.addPage();


    
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const instructor = course.instructorData;
        console.log(course, instructor);
        await this.downloadFichaTecnica(course, instructor, pdf, true,isPredyc);
        
        if (i < courses.length - 1) {
          pdf.addPage();
        }
      }

      
    };

    pdf.save(`${this.sanitizeFilename(titulo)}.pdf`);
    if(showLoading){
      Swal.close();
    }


  }

  async downloadFichaTecnicaMultiple(courses,titulo='Ficha_tecnica_Cursos',showLoading = true,isPredyc = true) {

    if(showLoading){
      Swal.fire({
        title: "Generando documento...",
        text: "Por favor, espera.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    console.log('courses',courses)



    const pdf = new jsPDF("p", "mm", "a4", true) as jsPDF;
  
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
    pdf.addFileToVFS("Roboto-Bold.ttf", robotoBold);
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const instructor = course.instructorData; // Suponiendo que tienes una manera de obtener el instructor para cada curso
      console.log(course, instructor);
      await this.downloadFichaTecnica(course, instructor, pdf, true,isPredyc);
      
      if (i < courses.length - 1) {
        pdf.addPage(); // Solo agregar una nueva página si no es el último curso
      }
    }
    pdf.save(`${this.sanitizeFilename(titulo)}.pdf`);
    if(showLoading){
      Swal.close();
    }
  }
  
  
    removeAccents(str: string): string {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    // Función para sanitizar el nombre del archivo
    sanitizeFilename(name: string): string {
      const nameWithoutAccents = this.removeAccents(name);
      return nameWithoutAccents.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    getRounded(num: number): number {
      return Math.round(num);
    }
  
    getFormattedDuration(tiempo,formatt = 'complete') {
      if(!tiempo){
        return ''
      }
      if(formatt == 'short'){
        return `${this.getRounded(tiempo / 60) }${this.getRounded(tiempo / 60) == 1 ? 'hr' : 'hrs'}`
      }
      const hours = Math.floor(tiempo / 60);
      const minutes = tiempo % 60;
      if(hours>0){
        if(hours>1){
          if(minutes>0){
            return `${hours} hrs ${minutes} min`;
          }
          else{
            return `${hours} hrs`;
          }
        }
        else{
          if(minutes>0){
            return `${hours} hr ${minutes} min`;
          }
          else{
            return `${hours} hr`;
          }
        }
      }
      else{
        return `${minutes} min`;
      }
  
    }
  
    async addFormattedTable(course: any, currentLine: number, pdf: jsPDF,isPredyc = true,isPillar=false): Promise<number> {
      const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
      const imgHeight = imgWidth / 4.65517241379;
      const tableMargin = this.pageWidth * 0.05; // Márgenes para centrar la tabla (5% de cada lado)
      const tableWidth = this.pageWidth * 0.9; // Ancho de la tabla (90% del ancho de la página)
      const headerHeight = 8; // Altura del encabezado del módulo
      let classHeight = 6.8; // Altura de las clases

      if(isPillar){
        classHeight= 8.8
      }

      for (let moduleIndex = 0; moduleIndex <course.modules.length; moduleIndex++){
          let modulo = course.modules[moduleIndex]
          // Dibujar encabezado del módulo
          const drawModuleHeader = (showDuration) => {
              const textYPosition = currentLine + (headerHeight / 2) + 1; // Ajuste para centrar verticalmente el texto
              pdf.setFillColor(240, 240, 240); // Color de fondo gris claro
              pdf.setDrawColor(0, 0, 0); // Color del borde
              pdf.setLineWidth(0.3); // Grosor de la línea ajustado
              pdf.roundedRect(tableMargin, currentLine, tableWidth, headerHeight, 0, 0, 'F'); // Dibujar rectángulo con esquinas redondeadas en la parte superior
              pdf.setFont("Roboto", "bold");
              pdf.setFontSize(9);
              pdf.setTextColor(0, 0, 0);
              pdf.text(`${isPillar?'Cursos de':''} ${modulo.titulo.trim()}`, tableMargin + 3, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              if (showDuration) {
                  let duracion = 0;
                  modulo.clases.forEach(clase => {
                      duracion += clase.duracion;
                  });
                  let duracionModulo = this.getFormattedDuration(duracion);
                  if(isPredyc && !isPillar){
                    if (duracion > 60) {
                      pdf.text(`${duracionModulo}`, 179, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                    } else if (duracion % 60 == 0) {
                        pdf.text(`${duracionModulo}`, 186, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                    } else {
                        pdf.text(`${duracionModulo}`, 183, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                    }
                  }

              }
              currentLine += headerHeight; // Espacio entre el encabezado y la primera clase
              // Dibujar línea gruesa debajo del encabezado del módulo
              pdf.line(tableMargin, currentLine, tableMargin + tableWidth, currentLine);
          };

          let offsetSpace = 0
          if(isPillar){
            offsetSpace = 10
          }
          // Verificar si se necesita una nueva página antes de dibujar el encabezado del módulo
          if (currentLine > this.pageHeigth - (25+offsetSpace)) {
              let old = pdf.getFontSize();
              pdf.addPage();
    
              // Agregar nombre del curso y logo en la esquina inferior derecha
              const posY = this.pageHeigth - imgHeight - 5;
              const maxTextWidth = this.pageWidth - imgWidth - 15;  // Ancho máximo del texto
              let courseTitle = course.titulo;
    
              // Ajustar el texto del curso si es demasiado largo
              while (pdf.getTextWidth(courseTitle) > maxTextWidth) {
                  courseTitle = courseTitle.slice(0, -1);  // Recortar el texto
              }
    
              const textWidth = pdf.getTextWidth(courseTitle);
              const posX = this.pageWidth - imgWidth - textWidth - 15; // Ajustar el espaciado según sea necesario
    
              pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
              pdf.setFont("Roboto", "normal");
              pdf.setTextColor(0, 0, 0);
              pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
              pdf.setFontSize(9);  // Ajustar el tamaño de la fuente
              let textoEmpresa = 'Predyc'
              let margen = 20
              if(!isPredyc){
                textoEmpresa = 'Predictiva21'
                margen = 25
              }
              pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });
              //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'SLOW');
    
              currentLine = 15;
              pdf.setFontSize(old);
          }

          //if(!isPillar){
            drawModuleHeader(true);
          //}
    
    
          // Dibujar clases del módulo


          for (let index = 0; index < modulo.clases.length; index++) {
              let clase =  modulo.clases[index]              
              const textYPosition = currentLine + (classHeight / 2) + 1; // Ajuste para centrar verticalmente el texto
              pdf.setFont("Roboto", "normal");
              pdf.setFontSize(8);
              pdf.setTextColor(0, 0, 0);
              let duracionClase = this.getFormattedDuration(clase.duracion,isPillar?'short':'complete');
              let tituloClase = clase.titulo.trim();
              if (tituloClase.length >= 125) {
                
                  //tituloClase = tituloClase.slice(0, 122) + '...';
              }
              // this._addFormatedText
              //pdf.text(`${tituloClase}`, tableMargin + 5, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              
              let pageWithOrg = this.pageWidth

              let marginOffSet = 0

              if(isPredyc){
                marginOffSet = 25
              }
              else{
                marginOffSet = 8
              }
              this.pageWidth = this.pageWidth - marginOffSet

              let offset = 4

              if(isPillar){
                offset = 2

                if(clase.imagen){
                  const imgSize = 120;  // Tamaño deseado para la imagen cuadrada
                  try {
                      const response = await fetch(clase.imagen);
                      const blob = await response.blob();
                       // Crear un canvas para redimensionar y convertir la imagen a PNG
                      const imageBitmap = await createImageBitmap(blob);
                      const canvas = document.createElement("canvas");
                      canvas.width = imgSize;
                      canvas.height = imgSize;
                      const ctx = canvas.getContext("2d");

                      // Dibujar la imagen en el canvas cuadrado
                      ctx?.drawImage(imageBitmap, 0, 0, imgSize, imgSize);

                      // Convertir la imagen del canvas a formato PNG
                      const imageData = canvas.toDataURL("image/png");

                      // Insertar la imagen en el PDF
                      pdf.addImage(imageData, 'PNG', 12, currentLine+1 , 9, 9,'','SLOW');

                  } catch (error) {
                      console.error("Error al cargar o transformar la imagen:", error);
                  }
                }
              }
              
              currentLine = this._addFormatedText({
                text: clase.titulo,
                course: course,
                x: 5 + (isPillar?8:0),
                y: currentLine-offset,
                size: 8,
                color: 'black',
                bold: false,
                textAlign: "left",
                maxLineWidth:isPillar?(this.pageWidth - 30):null
              }, pdf);

              this.pageWidth = pageWithOrg
              if(isPredyc){
                if (isPillar) {
                  pdf.text(`${duracionClase}`, this.pageWidth-20, textYPosition + (isPillar?1:0), { align: 'center' }); // Centrar el texto verticalmente
                }
                else if (clase.duracion >= 10 && clase.duracion % 60 != 0) {
                  pdf.text(`${duracionClase}`, 185, textYPosition + (isPillar?1:0), { align: 'left' }); // Centrar el texto verticalmente
                } else if (clase.duracion % 60 == 0) {
                    pdf.text(`${duracionClase}`, 186, textYPosition + (isPillar?1:0), { align: 'left' }); // Centrar el texto verticalmente
                } else {
                    pdf.text(`${duracionClase}`, 186, textYPosition + (isPillar?1:0), { align: 'left' }); // Centrar el texto verticalmente
                }
              }
              pdf.setDrawColor(200, 200, 200); // Color de la línea
              pdf.setLineWidth(0.2); // Grosor de la línea ajustado
              if (index < modulo.clases.length - 1) { // quitar si se quiere poner la linea en ultima clase
                pdf.line(tableMargin, currentLine + classHeight, tableMargin + tableWidth, currentLine + classHeight); // Línea debajo de cada clase
              }
              currentLine += classHeight; // Espacio entre las clases
    
              // Verificar si se necesita una nueva página después de dibujar una clase
              if (currentLine > this.pageHeigth - 30) {
                  let old = pdf.getFontSize();
                  if (moduleIndex < course.modules.length - 1 || index < modulo.clases.length - 1) {
                      pdf.addPage();
    
                      // Agregar nombre del curso y logo en la esquina inferior derecha
                      const posY = this.pageHeigth - imgHeight - 5;
                      const maxTextWidth = this.pageWidth - imgWidth - 15;  // Ancho máximo del texto
                      let courseTitle = course.titulo;
    
                      // Ajustar el texto del curso si es demasiado largo
                      console.log('courseTitle',course,courseTitle,maxTextWidth)
                      while (pdf.getTextWidth(courseTitle) > maxTextWidth) {
                          courseTitle = courseTitle.slice(0, -1);  // Recortar el texto
                      }
    
                      const textWidth = pdf.getTextWidth(courseTitle);
    
                      pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
                      pdf.setFont("Roboto", "normal");
                      pdf.setTextColor(0, 0, 0);
                      pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
                      pdf.setFontSize(9);  // Ajustar el tamaño de la fuente

                      let textoEmpresa = 'Predyc'
                      let margen = 20
                      if(!isPredyc){
                        textoEmpresa = 'Predictiva21'
                        margen = 25
                      }

                      pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });
                      //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'SLOW');
    
                      currentLine = 15;
                      pdf.setFontSize(old);
    
                      if (index < modulo.clases.length - 1) {
                          drawModuleHeader(false); // Redibujar encabezado del módulo en la nueva página si hay más clases
                      }
                  }
              }
          };
    
          currentLine += 0; // Espaciado entre módulos
      };
    
      return currentLine;
    }



  
    _addFormatedText(opts: textOpts, pdf: jsPDF): number {
      const imgWidth = 30;
      const imgHeight = imgWidth / 4.65517241379;
  
      const addFooterAndTitle = () => {
          let oldFontSize = pdf.getFontSize();
          
          const posY = this.pageHeigth - imgHeight - 5;
          const maxTextWidth = this.pageWidth - imgWidth - 15;
          let courseTitle = opts.course.titulo?  opts.course.titulo: '';
  
          while (pdf.getTextWidth(courseTitle) > maxTextWidth) {
              courseTitle = courseTitle.slice(0, -1);
          }
          
          let textoEmpresa = 'Predyc';
          let margen = 20;
          if (!this.isPredyc) {
              textoEmpresa = 'Predictiva21';
              margen = 25;
          }
  
          pdf.setFontSize(8);
          pdf.setFont("Roboto", "normal");
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
          pdf.setFontSize(9);
          pdf.text(textoEmpresa, this.pageWidth - margen, (posY + imgHeight / 2) + 2, { align: 'left' });
          pdf.setFontSize(oldFontSize);
      };
  
      if (opts.y > this.pageHeigth - 30) {
          pdf.addPage();
          addFooterAndTitle();
          opts.y = 15;
      }
  
      pdf.setFont("Roboto", opts?.bold ? "bold" : "normal");
      if (opts?.size) {
          pdf.setFontSize(opts.size);
      }
  
      opts.color == 'white' ? pdf.setTextColor(255, 255, 255) : pdf.setTextColor(0, 0, 0);
  
      const maxLineWidth = opts?.maxLineWidth ? opts.maxLineWidth : this.pageWidth - this.horizontalMargin * 2;
  
      let textLines = [];
      const paragraphs = opts.text.split('\n');
  
      for (const paragraph of paragraphs) {
          let offset = 0;
          let isBullet = false;
  
          let formattedParagraph = paragraph;
          if (formattedParagraph.trim().startsWith('*')) {
              formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
              offset = 5;
              isBullet = true;
          }
  
          const lines = pdf.splitTextToSize(formattedParagraph, maxLineWidth);
          lines.forEach((line, index) => {
              textLines.push({
                  text: line,
                  offset: isBullet ? offset : 0,
                  isBullet: isBullet && index === 0  // Solo la primera línea del bullet
              });
          });
      }
  
      const lineSpacingFactor = opts.lineSpacingFactor ?? 1;
  
      for (let index = 0; index < textLines.length; index++) {
          const lineHeight = pdf.getLineHeight() * lineSpacingFactor;
          const { text, offset, isBullet } = textLines[index];
  
          if (opts.y + (index + 1) * lineHeight > (this.pageHeigth+20)) {
              pdf.addPage();
              addFooterAndTitle();
              opts.y = -30;
              index--;
              continue;
          }
  
          let offset2 = 0;
          if (!text.startsWith('• ') && offset > 0) {
              offset2 = 2.9;
          }
  
          if (isBullet) {
              pdf.setFontSize(12);  // Tamaño de fuente más grande para el bullet
              pdf.text('•', opts.x + this.horizontalMargin + offset, opts.y + this.verticalMargin + lineHeight * (index + 1) / 2, { align: opts.textAlign });
              pdf.setFontSize(opts.size);  // Restaurar tamaño de fuente normal
              pdf.text(
                  text.slice(2).trim(),
                  opts.x + this.horizontalMargin + offset + 3,  // Ajustar posición del texto después del bullet
                  opts.y + this.verticalMargin + lineHeight * (index + 1) / 2,
                  { align: opts.textAlign }
              );
          } else {
              pdf.text(
                  text,
                  opts.x + this.horizontalMargin + offset + offset2,
                  opts.y + this.verticalMargin + lineHeight * (index + 1) / 2,
                  { align: opts.textAlign }
              );
          }
      }
  
      let nextHeightValue = opts.y + textLines.length * pdf.getLineHeight() * lineSpacingFactor / 2;
  
      return nextHeightValue;
  }
  
  
  
  
  
  
  
  
  
  addFormatedText(opts: textOpts,pdf:jsPDF): number {
    const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
    const imgHeight = imgWidth / 4.65517241379;

    if (opts.y > this.pageHeigth - 25) {
        let old = pdf.getFontSize();
        pdf.addPage();

        // Agregar nombre del curso y logo en la esquina inferior derecha
        const posY = this.pageHeigth - imgHeight - 5;
        const maxTextWidth = this.pageWidth - imgWidth - 15;  // Ancho máximo del texto
        let courseTitle = opts.course.titulo;

        // Ajustar el texto del curso si es demasiado largo
        while (pdf.getTextWidth(courseTitle) > maxTextWidth) {
            courseTitle = courseTitle.slice(0, -1);  // Recortar el texto
        }

        const textWidth = pdf.getTextWidth(courseTitle);
        const posX = this.pageWidth - imgWidth - textWidth - 15; // Ajustar el espaciado según sea necesario

        let textoEmpresa = 'Predyc'
        let margen = 20
        if(!this.isPredyc){
          textoEmpresa = 'Predictiva21'
          margen = 25
        }


        pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
        pdf.setFont("Roboto", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
        //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'SLOW');
        pdf.setFontSize(9);  // Ajustar el tamaño de la fuente
        
        pdf.text(textoEmpresa, this.pageWidth-margen, (posY + imgHeight / 2) + 2, { align: 'left' });

        opts.y = 10;
        pdf.setFontSize(old);
    }
    pdf.setFont("Roboto", opts?.bold ? "bold" : "normal");
    if (opts?.size) {
        pdf.setFontSize(opts.size);
    }

    opts.color == 'white' ? pdf.setTextColor(255, 255, 255) : pdf.setTextColor(0, 0, 0);

    const maxLineWidth = opts?.maxLineWidth ? opts.maxLineWidth : this.pageWidth - this.horizontalMargin * 2;
    const firstLineMaxWidth = opts?.firstLineMaxWidth ?? maxLineWidth;

    let textLines = [];
    if (opts.firstLineMaxWidth) {
        // Dividir el texto usando firstLineMaxWidth solo para la primera línea
        let remainingText = opts.text;
        const firstLine = pdf.splitTextToSize(remainingText, firstLineMaxWidth)[0];
        textLines.push(firstLine);
        remainingText = remainingText.substring(firstLine.length).trim();

        // Dividir el resto del texto usando maxLineWidth
        if (remainingText.length > 0) {
            const remainingLines = pdf.splitTextToSize(remainingText, maxLineWidth);
            textLines = textLines.concat(remainingLines);
        }
    } else {
        // Dividir todo el texto usando maxLineWidth si firstLineMaxWidth no está definido
        textLines = pdf.splitTextToSize(opts.text, maxLineWidth);
    }

    // Define un factor de ajuste para el interlineado
    const lineSpacingFactor = opts.lineSpacingFactor ?? 1; // Valor por defecto de 1

    for (let index = 0; index < textLines.length; index++) {
        const lineHeight = pdf.getLineHeight() * lineSpacingFactor;

        if (opts.textAlign === "justify" && index < textLines.length - 1) {
            this.justifyLine(textLines[index], opts.x + this.horizontalMargin, opts.y + this.verticalMargin + lineHeight * (index + 1) / 2, index === 0 && opts.firstLineMaxWidth ? firstLineMaxWidth : maxLineWidth,pdf);
        } else {
            pdf.text(
                textLines[index],
                opts.x + this.horizontalMargin,
                opts.y + this.verticalMargin + lineHeight * (index + 1) / 2,
                { align: opts.textAlign }
            );
        }
    }

    let nextHeightValue = opts.y + textLines.length * pdf.getLineHeight() * lineSpacingFactor / 2;

    return nextHeightValue;
}



  
  
  justifyLine(line: string, x: number, y: number, maxWidth: number,pdf:jsPDF) {
    const words = line.split(" ");
    const spaceWidth = pdf.getTextWidth(" ");
    const lineWidth = pdf.getTextWidth(line);
    const extraSpace = (maxWidth - lineWidth) / (words.length - 1);
    
    let currentX = x;
    
    words.forEach((word, index) => {
        if (index === words.length - 1) {
            pdf.text(word, currentX, y);
        } else {
            pdf.text(word, currentX, y);
            currentX += pdf.getTextWidth(word) + spaceWidth + extraSpace;
        }
    });
  }

  
}