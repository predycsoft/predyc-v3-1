import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { robotoBold } from '../../assets/fonts/Roboto/Roboto-bold';
import { robotoRegular } from '../../assets/fonts/Roboto/Roboto-normal';
import Swal from "sweetalert2";
import autoTable from 'jspdf-autotable';


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
    tituloFooter?: any;

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
    logoBlackP21 = "/assets/images/logos/logo-predictiva-negro-lg.png"
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

    // Función para convertir imágenes a PNG y devolver su relación de aspecto
    convertImageToPNGWithAspect(imageUrl: string): Promise<{ imgData: string; aspectRatio: number }> {
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
          const aspectRatio = img.width / img.height; // Calcular la relación de aspecto

          resolve({ imgData, aspectRatio });
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

  async downloadFichaTecnicaCourseDiplomadoP21(modulo,course, instructor, pdf: jsPDF, addToDocument: boolean = false,isPredyc = true) {

    console.log(course)

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
    // let courseTitle = `Módulo ${modulo.numero} - ${course.titulo}`;

    const hasShowDetailsTrue = modulo.clases.filter(course => (course.showDetails )).length > 1;
    let courseTitle = `${modulo.titulo}`;

    if(hasShowDetailsTrue){
      courseTitle = `${course.titulo}`;
    }
    else{
      let duracion = 0
      modulo.clases.forEach(clase => {
        duracion+=clase.duracion
      });
      course.duracion = duracion
    }

  
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
      size: 16,
      textAlign: "left",
      maxLineWidth: this.pageWidth - 60,
      firstLineMaxWidth: this.pageWidth - 95,
      lineSpacingFactor: 0.8
    }, pdf);
  
    const instructorSectionStartY = currentLine + 4;
    const instructorSectionEndY = 45.5;
  
    await this.addFormattedInstructor(instructor, instructorSectionStartY, instructorSectionEndY, pdf);
  
    pdf.setFontSize(17);
  
    let duracionCurso = this.getFormattedDuration(course.duracion * 60);
    
  
    pdf.addImage(this.reloj, 'png', 57.69, 45.02, 6, 6, '', 'SLOW');

    let txtDuracion = `Duración de la sesión: ${duracionCurso}`

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


      pdf.setFontSize(18);
      currentLine = 60;

      if(course.descripcion){

        currentLine = this._addFormatedText({
          text: 'Contenido',
          course: course,
          x: 0,
          y:currentLine,
          color: 'black',
          bold: true,
          size: 11,
          textAlign: "left",
          maxLineWidth: this.pageWidth - 20,
          firstLineMaxWidth: this.pageWidth - 95,
          lineSpacingFactor: 0.8
        }, pdf);

        let modules: { titulo: string, clases: string[] }[] = [];
        let currentModule: { titulo: string, clases: any[] } | null = null;

        // Dividir el contenido en líneas
        const lines = course.descripcion.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith('*') || trimmedLine.startsWith('>')) {
            // Es un bullet (clase)
            const clase = {
              titulo:trimmedLine.slice(1).trim(), // Quitar el '*' o '>' inicial
              duracion:0
            }
            if (currentModule) {
              currentModule.clases.push(clase);
            }
          } else if (trimmedLine) {
            // Es un módulo (no empieza con '*' o '>')
            if (currentModule) {
              // Si hay un módulo activo, cerrarlo
              modules.push(currentModule);
            }
            // Crear un nuevo módulo
            currentModule = { titulo: trimmedLine, clases: [] };
          }
        }

        // Asegurarse de agregar el último módulo si está abierto
        if (currentModule) {
          modules.push(currentModule);
        }
        course.modules = modules

      
        currentLine = currentLine +10
        currentLine = await this.addFormattedTable(course, currentLine, pdf,false);

        // currentLine = this._addFormatedTextP21({
        //   text: course.descripcion,
        //   course: course,
        //   x: 0,
        //   y:currentLine + 8,
        //   color: 'black',
        //   bold: false,
        //   size: 10,
        //   textAlign: "left",
        //   maxLineWidth: this.pageWidth - 20,
        //   firstLineMaxWidth: this.pageWidth - 95,
        //   lineSpacingFactor: 1
        // }, pdf);
        
      }



    }
  }

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

    if(isPredyc){
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
    }
    else{
      currentLine = this.addFormatedText({
        text: courseTitle,
        course: course,
        x: 48,
        y: -2,
        color: 'white',
        bold: true,
        size: 16,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 60,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
    }

  
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



  async addInstrcutorCV(pdf,course = null,instructor,isPredyc){

    console.log('Revisar',pdf,instructor)
    
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
    let courseTitle = course?.titulo;
  
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

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255, // Rojo
      g: (bigint >> 8) & 255,  // Verde
      b: bigint & 255          // Azul
    };
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


  addCalendarTableToPDF(pdf: jsPDF, diplomado: any) {


    let tableHeaders = [];


    if(diplomado.modules.length==1){
      tableHeaders = ['Módulo', 'Contenido', '#','Fecha', 'Horas', 'Instructor']
    }
    else{
      tableHeaders = ['Módulo', 'Contenido', '#','Fecha', 'Horas', 'Instructor']
    }
    const tableRows: any[] = [];
    const modulesCalendar = diplomado.modules;
    let sesionNumber = 0;
    for (let i = 0; i < modulesCalendar.length; i++) {
      const modulo = modulesCalendar[i];
      const cursos = modulo.clases;
  
      // Calcular la duración total del módulo
      const totalDuration = cursos.reduce((sum: number, course: any) => sum + course.duracion, 0);


    // Verificar si hay más de una clase con `showDetails: true` o si los nombres son diferentes
    const hasDifferentNames = new Set(cursos.map(course => course.titulo)).size > 1;
    const hasShowDetailsTrue = cursos.filter(course => (course.showDetails )).length > 1;
  
      // Agregar una fila combinada para el módulo

      if (( hasShowDetailsTrue)) {


        let red = 127
        let green = 201
        let blue = 255
    
        
        if(diplomado.color){
          const { r, g, b } = this.hexToRgb(diplomado.color);

          // Factor de aclarado (0 = sin cambio, 1 = blanco)
          const lightenFactor = 0.5;

          // Función para aclarar un componente RGB
          const lighten = (component: number, factor: number) => {
            return Math.min(255, Math.round(component + (255 - component) * factor));
          };

          // Calcular los nuevos valores de color aclarado
          red = lighten(r, lightenFactor);
          green = lighten(g, lightenFactor);
          blue = lighten(b, lightenFactor);

        }

        tableRows.push([
          {
            content: modulo.titulo,
            colSpan: 6,
            styles: {
              halign: 'center',
              fillColor: [red, green, blue],
              fontStyle: 'bold',
            },
          },
        ]);
        


      }

  
  
      for (let j = 0; j < cursos.length; j++) {
        sesionNumber ++
        const course = cursos[j];

        const instructor = course.instructorData?.nombre || 'Sin asignar';
  
        // Formatear la fecha

        const [year, month, day] = course.fechaInicio.split('-').map(Number); // Descomponer la fecha en partes
        const adjustedDate = new Date(year, month - 1, day); // Crear la fecha sin considerar la hora local
        
        const formattedDate = adjustedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });  
        // Construir la fila
        const row = [];
        if (j === 0 && diplomado.modules.length>1) {
          let colSpan = 1
          if(cursos.length == 1){
            colSpan = 1
          }
          row.push({
            content: i + 1,
            rowSpan: cursos.length,
            colSpan:colSpan,
            styles: { halign: 'center', valign: 'middle' },
          });
        }
        //hasShowDetailsTrue
        let titleCourse = course.titulo

        if(!hasShowDetailsTrue){
          titleCourse =  modulo.titulo
        }

        row.push({ nameCell:true, modulo:modulo,content: titleCourse, styles: { halign: 'left', valign: 'middle',fontSize: 8, } } ); // Contenidos
        if(true || cursos.length>1){
          row.push({ content:sesionNumber, styles: { halign: 'center' } }); // Sesión
        }
        row.push({formattedDate:true, modulo:modulo,content: formattedDate, styles: { halign: 'center',fontSize: 8, } }); // Fecha
        if (j === 0) {
          row.push({
            content: totalDuration,
            rowSpan: cursos.length,
            styles: { halign: 'center', valign: 'middle' },
          });
        }
        row.push({ instructor:true,modulo:modulo,content: instructor,rowSpan:1, styles:  { halign: 'center', valign: 'middle' }});     // Instructor temporal
        tableRows.push(row);
      }
    }


    tableRows.forEach((row, index) => {
      // Buscar celdas de instructor y fecha
      const instructorCell = row.find((cell) => cell?.instructor);
      const fechaCell = row.find((cell) => cell?.formattedDate);
      const nameCell = row.find((cell) => cell?.nameCell);

      // Lógica para combinar instructores consecutivos
      if (instructorCell) {
        let currentInstructor = instructorCell.content;
        let currentModulo = instructorCell.modulo;
        let instructorRowSpan = 1;
    
        for (let i = index + 1; i < tableRows.length; i++) {
          const nextRow = tableRows[i];
          const nextInstructorCell = nextRow.find((cell) => cell?.instructor);
    
          if (
            nextInstructorCell &&
            nextInstructorCell.content === currentInstructor &&
            nextInstructorCell.modulo === currentModulo
          ) {
            instructorRowSpan++;
            nextRow[nextRow.indexOf(nextInstructorCell)] = null; // Marcar como nulo
          } else {
            break;
          }
        }
    
        instructorCell.rowSpan = instructorRowSpan; // Actualizar rowSpan
      }

      // Lógica para combinar instructores consecutivos
      if (nameCell) {
        let currentSessionName = nameCell.content;
        let currentModulo = nameCell.modulo;
        let SessionNameRowSpan = 1;
    
        for (let i = index + 1; i < tableRows.length; i++) {
          const nextRow = tableRows[i];
          const nextnameCell = nextRow.find((cell) => cell?.nameCell);
    
          if (
            nextnameCell &&
            nextnameCell.content === currentSessionName &&
            nextnameCell.modulo === currentModulo
          ) {
            SessionNameRowSpan++;
            nextRow[nextRow.indexOf(nextnameCell)] = null; // Marcar como nulo
          } else {
            break;
          }
        }
    
        nameCell.rowSpan = SessionNameRowSpan; // Actualizar rowSpan
      }
    
      // Lógica para combinar fechas consecutivas
      if (fechaCell) {
        let currentFecha = fechaCell.content;
        let currentModulo = fechaCell.modulo;
        let fechaRowSpan = 1;
    
        for (let i = index + 1; i < tableRows.length; i++) {
          const nextRow = tableRows[i];
          const nextFechaCell = nextRow.find((cell) => cell?.formattedDate);
    
          if (
            nextFechaCell &&
            nextFechaCell.content === currentFecha &&
            nextFechaCell.modulo === currentModulo
          ) {
            fechaRowSpan++;
            nextRow[nextRow.indexOf(nextFechaCell)] = null; // Marcar como nulo
          } else {
            break;
          }
        }
    
        fechaCell.rowSpan = fechaRowSpan; // Actualizar rowSpan
      }
    });
    
    // Filtrar las filas para eliminar las celdas marcadas como nulas
    const tableRowsFinal = tableRows.map((row) => row.filter((cell) => cell !== null));
    let isFirstTablePage = true; // Bandera para controlar la primera página de la tabla


    let red = 5
    let green = 126
    let blue = 212

    
    if(diplomado.color){
      const { r, g, b } = this.hexToRgb(diplomado.color);
      pdf.setTextColor(r, g, b);
      red = r
      green = g
      blue = b
    }

    autoTable(pdf, {
      head: [tableHeaders],
      body: tableRowsFinal,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, valign: 'middle' },
      headStyles: { fillColor: [red, green, blue], halign: 'center' },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
      startY: 60, // Espacio inicial para la primera página
      
      didDrawPage: (data) => {
        if (isFirstTablePage) {


          let subtituloWidth = 0




          if(diplomado.subtitulo){
            pdf.setTextColor(5, 126, 212);

            if(diplomado.color){
              const { r, g, b } = this.hexToRgb(diplomado.color);
              pdf.setTextColor(r, g, b);

            }
            pdf.setFont("Roboto", 'bold');
            pdf.setFontSize(18);
            pdf.text(diplomado.subtitulo, data.settings.margin.left,35);


            subtituloWidth = pdf.getTextWidth(diplomado.subtitulo);



          }


          const legendX = data.settings.margin.left + subtituloWidth +5; // Alinear con el margen de la tabla
          const legendY = 30; // Posición debajo del encabezado
          const legendPadding = 5;
    
          const [year, month, day] = diplomado.fechaInicio.split('-').map(Number); // Descomponer la fecha en partes
          const adjustedDate = new Date(year, month - 1, day); // Crear la fecha sin considerar la hora local
          
          const formattedDate = adjustedDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
    
          // Calcular el ancho del cuadro basado en el texto más largo
          const textLines = [
            `Fecha de inicio: ${formattedDate}`,
            `Duración: ${diplomado.duracion}`,
            `Sesiones: ${diplomado.diaSesiones}`,
          ];
          const maxTextWidth = Math.max(...textLines.map((text) => pdf.getTextWidth(text)));
          let legendWidth = maxTextWidth  + 2 * legendPadding;
          if(diplomado.subtitulo){
            legendWidth = maxTextWidth- subtituloWidth + 7 * legendPadding;

          }
          const legendHeight = textLines.length * 6 + legendPadding; // Altura basada en líneas y padding

          legendWidth = (this.pageWidth - legendX) - 15

    
          // Dibujar el cuadro de la leyenda
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(legendX, legendY, legendWidth, legendHeight, 1, 1, 'F'); // Usar esquinas redondeadas

          if(diplomado.color){
            const { r, g, b } = this.hexToRgb(diplomado.color);
            pdf.setFillColor(r, g, b);

          }
          else{
            pdf.setFillColor(5, 126, 212);
          }

          pdf.roundedRect(legendX, legendY, 0.6, legendHeight, 0, 0, 'F'); // Usar esquinas redondeadas

          if(diplomado.year){
            pdf.setFont("Roboto", 'bold');
            pdf.setFontSize(40);
            pdf.text(diplomado.year, data.settings.margin.left,50);
          }
    
          // Dibujar el texto de la leyenda
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          textLines.forEach((text, index) => {
            const isBold = text.includes(':');
            const [label, value] = text.split(': ');
            if (isBold && value) {
              pdf.setFont("Roboto", 'normal');
              pdf.text(label + ':', legendX + legendPadding, legendY + 2 + legendPadding + index * 6);
              pdf.setFont("Roboto", 'bold');
              pdf.text(value, legendX + legendPadding + pdf.getTextWidth(label + ': '), legendY + 2 + legendPadding + index * 6);
            } else {
              pdf.text(text, legendX + legendPadding, legendY + 2 + legendPadding + index * 6);
            }
          });
    
          isFirstTablePage = false; // Cambiar la bandera después de la primera página
        }
    
        // Encabezado común para todas las páginas
        pdf.setFillColor(35, 43, 56);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');
    
        const imgWidtLogoWhiteInit = 27;
        const imgHeightLogoWhiteInit = imgWidtLogoWhiteInit / 4.3;
    
        pdf.addImage(this.logoWhite, 'png', 150, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');
        pdf.addImage(this.logoWhiteP21, 'png', 180, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');
    
        let currentLine = -7;
    
        currentLine = this._addFormatedText(
          {
            text: 'Cronograma',
            course: null,
            x: 0,
            tituloFooter: diplomado.titulo,
            y: currentLine,
            size: 26,
            color: 'white',
            bold: true,
            textAlign: 'left',
          },
          pdf
        );
      },
      margin: { top: 40 }, // Ajuste común para las páginas
    });
    
  }
  
  
  

  generateCalendarHTML(diplomado: any): string {
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #7fc9ff; color: #ffffff;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Módulo</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Sesión</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Contenidos</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Fecha</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Horas</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Instructor</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    const modulesCalendar = diplomado.modules;
  
    for (let i = 0; i < modulesCalendar.length; i++) {
      const modulo = modulesCalendar[i];
      const cursos = modulo.clases;
  
      // Calcular la duración total del módulo
      const totalDuration = cursos.reduce((sum, course) => sum + course.duracion, 0);
  
      // Agregar una fila para el título del módulo
      html += `
        <tr style="background-color: #d6eaff; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #ddd; padding: 8px;" colspan="6">${modulo.titulo}</td>
        </tr>
      `;
  
      // Agregar filas para las sesiones del módulo
      for (let j = 0; j < cursos.length; j++) {
        const course = cursos[j];
        const instructor = course.instructorData;
  
        // Formatear la fecha
        const formattedDate = course.fechaInicio
          ? new Date(course.fechaInicio).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "Sin fecha";
  
        // Agregar fila para cada curso
        html += `
          <tr>
            ${j === 0
              ? `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;" rowspan="${cursos.length}">${i + 1}</td>`
              : ""}
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${j + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${course.titulo}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formattedDate}</td>
            ${
              j === 0
                ? `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;" rowspan="${cursos.length}">${totalDuration}</td>`
                : ""
            }
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${instructor?.nombre || "Sin asignar"}</td>
          </tr>
        `;
      }
    }
  
    html += `
        </tbody>
      </table>
    `;
  
    return html;
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

  async downloadP21Diplomado(diplomado) {

    console.log(diplomado)
    

    let showLoading = true
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

    const imgPortada = await this.convertImageToPNG(diplomado.imagen);
    pdf.addImage(imgPortada, 'PNG', 0, 0, 210, 297,'','SLOW')


    pdf.addPage();

    const imgWidtLogoWhiteInit = 27; // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhiteInit = imgWidtLogoWhiteInit / 4.3;


    const imageUrl = diplomado.banner;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const { imgData, aspectRatio } = await this.convertImageToPNGWithAspect(imageUrl);

    // Ajustar el ancho y alto de la imagen al 80% del ancho de la página, manteniendo la proporción
    const imgWidth = pageWidth * 0.8;
    const imgHeight = imgWidth / aspectRatio;

    // Calcular la posición para centrar la imagen
    const centerX = Math.round((pageWidth - imgWidth) / 2);
    const centerY = Math.round((pageHeight - imgHeight) / 2);

    // Añadir la imagen al PDF

    // Ajustar el fondo de color para cubrir hasta un poco debajo del último logo
    const fondoHeight = imgHeight - 10; // 10 de margen adicional debajo del último logo
    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), fondoHeight, 'F');

    pdf.addImage(imgData, 'PNG', 10, -2, Math.round(imgWidth / 1.5), Math.round(imgHeight / 1.5), '', 'SLOW');
    pdf.addImage(this.logoWhite, 'png', 150, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');
    pdf.addImage(this.logoWhiteP21, 'png', 180, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');


    this.pageHeigth = pdf.internal.pageSize.height; //297mm
    this.pageWidth = pdf.internal.pageSize.width; //210mm
    this.isPredyc = false
    let currentLine = fondoHeight + 10 

    if(diplomado.descripcion){
      currentLine = this._addFormatedText2({
        text: 'Acerca del Diplomado',
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine,
        color: 'black',
        bold: true,
        size: 11,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
  
      currentLine = this._addFormatedText2({
        text: diplomado.descripcion,
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine + 3,
        color: 'black',
        bold: false,
        size: 10,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);

    }

    if(diplomado.objetivo){

      currentLine = this._addFormatedText2({
        text: 'Objetivos del Diplomado',
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine+5,
        color: 'black',
        bold: true,
        size: 11,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
  
      currentLine = this._addFormatedText2({
        text: diplomado.objetivo,
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine + 3,
        color: 'black',
        bold: false,
        size: 10,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
    }


    if(diplomado.aQuienVaDirigido){

      currentLine = this._addFormatedText2({
        text: "A quién va dirigido",
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine+5,
        color: 'black',
        bold: true,
        size: 11,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
  
      currentLine = this._addFormatedText2({
        text: diplomado.aQuienVaDirigido,
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y:currentLine + 3,
        color: 'black',
        bold: false,
        size: 10,
        textAlign: "left",
        maxLineWidth: this.pageWidth - 20,
        firstLineMaxWidth: this.pageWidth - 95,
        lineSpacingFactor: 0.8
      }, pdf);
    }

    if(diplomado.queIncluye){

      currentLine = this._addFormatedText2({
        text: "Qué incluye",
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y: currentLine+5,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText2({
        text: diplomado.queIncluye,
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y: currentLine + 3,
        size: 10,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    if(diplomado.modalidadCapacitacion){
      pdf.setFontSize(14);
      currentLine = currentLine + 3;


      currentLine = this._addFormatedText2({
        text: "Modalidad de la capacitación",
        course: null,
        tituloFooter: diplomado.titulo,
        x: 0,
        y: currentLine,
        size: 11,
        color: 'black',
        bold: true,
        textAlign: "left"
      }, pdf);

      pdf.setFontSize(10);
      currentLine = this._addFormatedText2({
        text: diplomado.modalidadCapacitacion,
        course: null,
        tituloFooter: diplomado.titulo,
        x: 0,
        y: currentLine + 3,
        size: 10,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

    pdf.addPage();

    // Fondo superior
    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 90, 'F');

    //Configuración de la línea
    const lineWidth = pdf.internal.pageSize.getWidth() * 0.8; // 80% del ancho de la página
    const lineX = (pdf.internal.pageSize.getWidth() - lineWidth) / 2; // Centrar horizontalmente
    const lineY = 20
    const lineHeight = 0.5;

    // Dibujar la línea
    pdf.setDrawColor(0, 0, 0); // Color negro
    pdf.setLineWidth(lineHeight);
    pdf.line(lineX, lineY, lineX + lineWidth, lineY);

    // Configuración del rectángulo
    const rectWidth = 60; // Ancho del rectángulo
    const rectHeight = 15; // Alto del rectángulo
    const rectX = (pdf.internal.pageSize.getWidth() - rectWidth) / 2; // Centrar horizontalmente
    const rectY = lineY - rectHeight / 2; // Centrar sobre la línea

    // Dibujar el rectángulo
    pdf.setFillColor(255, 255, 255); // Color de fondo blanco
    pdf.setDrawColor(0, 0, 0); // Color del borde negro
    pdf.roundedRect(rectX, rectY, rectWidth, rectHeight, 3, 3, 'FD'); // Con bordes redondeados


    pdf.setFontSize(24);
    pdf.setFont('Roboto', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('+ 3000', 80,23);



    pdf.setFontSize(10);
    pdf.setFont('Roboto', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Profesionales', 108,19.5);
    pdf.text('capacitados', 108,23);


    

    // Fechas con contenido
    const timeline = [
      { year: '2013',yearColor:[127, 201, 255], text: 'Iniciamos la Revista Digital más prestigiosa de Mantenimiento, Confiabilidad y Gestión de Activos en LATAM' },
      { year: '2019',yearColor:[5, 126, 212], text: 'Predictiva21 se constituye como líder en capacitación a nivel online y presencial.' },
      { year: '2021',yearColor:[255, 186, 0], text: 'Fundación de Predyc, la aplicación de capacitación industrial del futuro para LATAM.' },
    ];

    const timelineStartY = 50;

    timeline.forEach((item, index) => {
      const boxStartX = 20 + index * (pdf.internal.pageSize.getWidth() - 40) / timeline.length;

      // Año
      pdf.setFontSize(20);
      pdf.setFont('Roboto', 'bold');
      pdf.setTextColor(item.yearColor[0], item.yearColor[1], item.yearColor[2]);
      pdf.text(item.year, boxStartX + 10, timelineStartY);

      pdf.setFillColor(item.yearColor[0], item.yearColor[1], item.yearColor[2]); // Ajustado: valores directos en lugar de spread operator
      pdf.rect(boxStartX + 10, timelineStartY + 3, 10, 0.5, 'F');

      // Descripción
      pdf.setFontSize(10);
      pdf.setFont('Roboto', 'normal');
      pdf.setTextColor(255, 255, 255);
      pdf.text(item.text, boxStartX + 10, timelineStartY + 10, { maxWidth: (pdf.internal.pageSize.getWidth() - 40) / timeline.length - 10 });
    });

    // Barra inferior de color
    const barColors = [
      [127, 201, 255], // Azul
      [5, 126, 212], // Azul oscuro
      [255, 186, 0],   // Amarillo
    ];

    barColors.forEach((color, index) => {
      pdf.setFillColor(color[0], color[1], color[2]); // Ajustado: valores directos en lugar de spread operator
      pdf.rect(index * (pdf.internal.pageSize.getWidth() / 3), 90, pdf.internal.pageSize.getWidth() / 3, 3, 'F');
    });

    // Sección inferior: "Experiencia de Predictiva21"
    pdf.setFontSize(18);
    pdf.setFont('Roboto', 'bold');
    pdf.setTextColor(5, 126, 212);
    pdf.text('Experiencia de', 10, 90+25);

    // Logo

    const imgWidtLogoWhiteResumen = 35; // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhiteResumen= imgWidtLogoWhiteResumen / 4.3;


    pdf.addImage(this.logoBlackP21, 'png', 54, (90+25-6), imgWidtLogoWhiteResumen, imgHeightLogoWhiteResumen, '', 'SLOW');

    // Texto largo
    const content = `     Todo comenzó en el año 2013 cuando lanzamos Predictiva21, la revista digital que pronto se convertiría en la más prestigiosa de América Latina en el ámbito de la Ingeniería de Mantenimiento, Confiabilidad y Gestión de Activos. Nuestro objetivo era claro: proporcionar un recurso de alto valor que ofreciera conocimientos, noticias y análisis de vanguardia para profesionales del sector.

    Avanzamos hacia 2019, un año monumental en nuestra historia, ya que Predictiva21 se consolidó como líder indiscutible en capacitación, ofreciendo cursos en línea en vivo y presenciales. Nuestra propuesta de valor se centró en adaptar y responder a las necesidades cambiantes de los profesionales y empresas de América Latina, fortaleciendo sus competencias y conocimiento a través de formación de alta calidad.

    En 2021, nació Predyc, marcando un hito significativo en la capacitación industrial. Concebida específicamente para responder a las crecientes demandas de las grandes corporaciones, Predyc se establece como una plataforma de formación robusta y escalable.

    Predyc ofrece soluciones a medida que permiten a las grandes organizaciones formar a sus equipos y tener acceso a un recurso educativo que entiende la magnitud de sus operaciones y la importancia de la eficiencia y la calidad en la formación de su capital humano.`;

    pdf.setFontSize(10);
    pdf.setFont('Roboto', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(content, 10, 165-30, { maxWidth: pdf.internal.pageSize.getWidth() - 20 });

    //calendario

    pdf.addPage()


    this.addCalendarTableToPDF(pdf, diplomado);


    if(diplomado.final){
      // Pagina de proyecto final
      pdf.addPage()


      pdf.setFillColor(35, 43, 56);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');

      pdf.addImage(this.logoWhite, 'png', 150, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');
      pdf.addImage(this.logoWhiteP21, 'png', 180, 5, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');

      currentLine = -7

      currentLine = this._addFormatedText({
        text: 'Proyecto final',
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y: currentLine,
        size: 26,
        color: 'white',
        bold: true,
        textAlign: "left"
      }, pdf);

      currentLine = 25


      currentLine = this._addFormatedText({
        text: diplomado.final,
        course: null,
        x: 0,
        tituloFooter: diplomado.titulo,
        y: currentLine,
        size: 10,
        color: 'black',
        bold: false,
        textAlign: "left"
      }, pdf);

    }

   

    // Subportada de contenido con fondo

    pdf.addPage()


    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

    // Añadir la imagen al PDF
    pdf.addImage(imgData, 'PNG', centerX, centerY-20, imgWidth, imgHeight,'','SLOW');



    // Ajustar la llamada al método `text` con la nueva posición en X
    pdf.setFontSize(40);  // Ajustar el tamaño de la fuente
    pdf.setFont("Roboto", "bold");

    // Calcular la posición X para centrar el texto
    const textWidth = pdf.getTextWidth(`CONTENIDO`);
    const centerXTxt = (pageWidth - textWidth) / 2;

    pdf.setTextColor(255, 255, 255);
    pdf.text(`CONTENIDO`, centerXTxt, (centerY - 20 + imgHeight) + 30, { align: 'left' })

    // Configuración del tamaño de los logos
    const imgWidtLogoWhite = 40;  // Ancho del logo
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;  // Altura manteniendo la proporción

    // Posición vertical para los logos (cerca de la parte inferior)
    const footerImgHeight = pdf.internal.pageSize.getHeight() - 30;

    // Configuración de espacio entre los logos
    const spaceBetweenLogos = 10; // Ajusta este valor según el espacio deseado entre los logos

    // Ancho total ocupado por ambos logos y el espacio entre ellos
    const totalLogosWidth = imgWidtLogoWhite * 2 + spaceBetweenLogos;

    // Posición inicial horizontal para centrar ambos logos
    const startX = (pdf.internal.pageSize.getWidth() - totalLogosWidth) / 2;

    // Agregar el primer logo
    pdf.addImage(this.logoWhite, 'png', startX, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');

    // Agregar el segundo logo con espacio entre ellos
    pdf.addImage(this.logoWhiteP21, 'png', startX + imgWidtLogoWhite + spaceBetweenLogos, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');

    // Agregar una nueva página

    const instructores = [];
    const uniqueInstructorIds = new Set();

    let curso = null
    pdf.addPage();

    
    const modulesIN = diplomado.modules
    const modules = modulesIN.filter(x=>x.clases.find(x=>x.showDetails))
    
    console.log('modules show pdf',modules)
    for (let i = 0; i < modules.length; i++) {
      const modulo = modules[i];
      const cursos = modulo.clases.filter(x=>x.showDetails);

      console.log('cursos Show pdf',cursos,modulo.clases)
    
      for (let j = 0; j < cursos.length; j++) {
        const course = cursos[j];
        const instructor = course.instructorData;
    
        // Agregar instructor único al arreglo
        if (instructor && !uniqueInstructorIds.has(instructor.id)) {
          uniqueInstructorIds.add(instructor.id);
          instructores.push(instructor);
        }
        
        course.imagen = course.image;
        curso=course
        await this.downloadFichaTecnicaCourseDiplomadoP21(modulo, course, instructor, pdf, true, false);
        console.log(modules.length, cursos.length, i, j);
    
        // Agregar una nueva página si no es la última clase del último módulo
        if (i < modules.length - 1 || j < cursos.length - 1) {
          pdf.addPage();
        }
        
      }
    }
    
    

    pdf.addPage();


    // Subportada de instructores con fondo
    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');


    // Añadir la imagen al PDF
    pdf.addImage(imgData, 'PNG', centerX, centerY-20, imgWidth, imgHeight,'','SLOW');

    // Ajustar la llamada al método `text` con la nueva posición en X
    pdf.setFontSize(40);  // Ajustar el tamaño de la fuente
    pdf.setFont("Roboto", "bold");

    // Calcular la posición X para centrar el texto
    // Calcular la posición X para centrar el texto
    const textWidthIns = pdf.getTextWidth(`INSTRUCTORES`);
    const centerXIns = (pageWidth - textWidthIns) / 2;

    pdf.setTextColor(255, 255, 255);
    pdf.text(`INSTRUCTORES`, centerXIns, (centerY - 20 + imgHeight) + 30, { align: 'left' })

    // Agregar el primer logo
    pdf.addImage(this.logoWhite, 'png', startX, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');

    // Agregar el segundo logo con espacio entre ellos
    pdf.addImage(this.logoWhiteP21, 'png', startX + imgWidtLogoWhite + spaceBetweenLogos, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');


    console.log('Instructores únicos:', instructores);
    for (let i = 0; i < instructores.length; i++) {
      const instructor = instructores[i]
      const cursoAux ={
        titulo:diplomado.titulo
      }
      await this.addInstrcutorCV(pdf,cursoAux,instructor,false)
      
    }

    pdf.addPage()

    // Subportada de contenido con fondo
    pdf.setFillColor(35, 43, 56);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

      // Texto principal centrado
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(26);

      const mainText = [
        { text: 'La', color: [255, 255, 255] },
        { text: ' Confiabilidad', color: [127, 201, 255] },
        { text: ' inicia con la EDUCACIÓN', color: [255, 255, 255] },
      ];

      // Calcular el ancho total del texto principal
      let totalTextWidth = 0;
      mainText.forEach((line) => {
        pdf.setTextColor(line.color[0], line.color[1], line.color[2]);
        totalTextWidth += pdf.getTextWidth(line.text);
      });

      // Calcular las posiciones para centrar
      let currentX = (pageWidth - totalTextWidth) / 2;
      const mainTextY = pageHeight / 2 - 10; // Posición vertical ajustada

      mainText.forEach((line) => {
        pdf.setTextColor(line.color[0], line.color[1], line.color[2]);
        pdf.text(line.text, currentX, mainTextY);
        currentX += pdf.getTextWidth(line.text); // Mover X según el ancho del texto actual
      });

      // Texto secundario centrado
      const subText = 'Predictiva21 - La revista de Mantenimiento #1 en LATAM';
      pdf.setFont('Roboto', 'italic');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);

      const subTextWidth = pdf.getTextWidth(subText);
      const subTextX = (pageWidth - subTextWidth) / 2;
      const subTextY = mainTextY + 10; // Separación vertical ajustada

      pdf.text(subText, subTextX, subTextY);


    
  

    // Agregar el primer logo
    pdf.addImage(this.logoWhite, 'png', startX, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');

    // Agregar el segundo logo con espacio entre ellos
    pdf.addImage(this.logoWhiteP21, 'png', startX + imgWidtLogoWhite + spaceBetweenLogos, footerImgHeight, imgWidtLogoWhite, imgHeightLogoWhite, '', 'SLOW');



    pdf.save(`${this.sanitizeFilename(diplomado.titulo)}.pdf`);

    if(showLoading){
      Swal.close();
    }

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

    titleCase(str: string): string {
      if (!str) return str;
      return str.toLowerCase().split(' ').map(word => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
      }).join(' ');
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
  
    async addFormattedTable(course: any, currentLine: number, pdf: jsPDF,isPredyc = true,isPillar=false,isCalendar = false): Promise<number> {
      const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
      const imgHeight = imgWidth / 4.65517241379;
      const tableMargin = this.pageWidth * 0.05; // Márgenes para centrar la tabla (5% de cada lado)
      const tableWidth = this.pageWidth * 0.9; // Ancho de la tabla (90% del ancho de la página)
      const headerHeight = 8; // Altura del encabezado del módulo
      let classHeight = 6.8; // Altura de las clases

      if(isPillar){
        classHeight= 8.8
      }

      console.log('course.modules',course.modules)

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
              let nombreModule = `${isPillar?'Cursos de':''} ${modulo.titulo.trim()}`
              if(isCalendar){
                nombreModule = modulo.titulo.trim().toUpperCase()
                pdf.setTextColor(0, 112, 192);
              }
              pdf.text(nombreModule, tableMargin + 3, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              pdf.setTextColor(0, 0, 0);
              
              if (showDuration) {
                  let duracion = 0;
                  modulo.clases.forEach(clase => {
                      duracion += clase.duracion;
                  });
                  let duracionModulo = this.getFormattedDuration(duracion);
                  if(isPredyc && (!isPillar)){
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

              let offsetTitleCase = isPillar?8:0

              // curso: "curso"
              if(isCalendar && clase?.typeLocal == 'curso'){
                offset = 4
              }


              if(isCalendar){
                clase.titulo = `${this.formatearFecha(clase.fechaInicio)}: ${clase.titulo}`
              }

              
              currentLine = this._addFormatedText({
                text: clase.titulo,
                course: course,
                x: 5 + (offsetTitleCase),
                y: currentLine-offset,
                size: 8,
                color: 'black',
                bold: isCalendar?true:false,
                textAlign: "left",
                maxLineWidth:isPillar?(this.pageWidth - 30):null
              }, pdf);
              
              console.log(clase)
              if(isCalendar && clase?.typeLocal == 'curso'){
                let textoInstructor = `Instructor: ${clase.instructorData.nombre} | ${clase.instructorData.resumen}`
                if(textoInstructor.length>130){
                  textoInstructor = textoInstructor.slice(0, 130) + '...';
                }

                currentLine = this._addFormatedText({
                  text: textoInstructor,
                  course: course,
                  x: 5 + (offsetTitleCase),
                  y: currentLine-1,
                  size: 8,
                  color: 'black',
                  bold: false,
                  textAlign: "left",
                  maxLineWidth:this.pageWidth
                }, pdf);
                currentLine = currentLine - 2
              }

              this.pageWidth = pageWithOrg
              if(isPredyc){
                if (isPillar) {
                  if(!isCalendar){
                    pdf.text(`${duracionClase}`, this.pageWidth-20, textYPosition + (isPillar?1:0), { align: 'center' }); // Centrar el texto verticalmente
                  }
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

      const pageHeigth = pdf.internal.pageSize.height; //297mm
      const pageWidth = pdf.internal.pageSize.width; //210mm
  
      const addFooterAndTitle = () => {
          let oldFontSize = pdf.getFontSize();
          
          const posY = pageHeigth - imgHeight - 5;
          const maxTextWidth = pageWidth - imgWidth - 15;
          let courseTitle = opts?.course?.titulo?  opts?.course?.titulo: opts.tituloFooter;
  
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
          pdf.text(textoEmpresa, pageWidth - margen, (posY + imgHeight / 2) + 2, { align: 'left' });
          pdf.setFontSize(oldFontSize);
      };
  
      if (opts.y > pageHeigth - 30) {
          pdf.addPage();
          addFooterAndTitle();
          opts.y = 15;
      }
  
      pdf.setFont("Roboto", opts?.bold ? "bold" : "normal");
      if (opts?.size) {
          pdf.setFontSize(opts.size);
      }
  
      opts.color == 'white' ? pdf.setTextColor(255, 255, 255) : pdf.setTextColor(0, 0, 0);
  
      const maxLineWidth = opts?.maxLineWidth ? opts.maxLineWidth : pageWidth - this.horizontalMargin * 2;
  
      let textLines = [];
      const paragraphs = opts.text.split('\n');
  
      for (const paragraph of paragraphs) {
          let offset = 0;
          let isBullet = false;
          let isSubBullet = false;

  
          let formattedParagraph = paragraph;
          if (formattedParagraph.trim().startsWith('*')) {
              formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
              offset = 5;
              isBullet = true;
          }

          if (formattedParagraph.trim().startsWith('>')) {
            formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
            offset = 8;
            isBullet = true;
            isSubBullet = true
        }
  
          const lines = pdf.splitTextToSize(formattedParagraph, maxLineWidth);
          lines.forEach((line, index) => {
              textLines.push({
                  text: line,
                  offset: isBullet ? offset : 0,
                  isBullet: isBullet && index === 0,  // Solo la primera línea del bullet
                  isSubBullet:isSubBullet,
              });
          });
      }
  
      const lineSpacingFactor = opts.lineSpacingFactor ?? 1;
  
      for (let index = 0; index < textLines.length; index++) {
          const lineHeight = pdf.getLineHeight() * lineSpacingFactor;
          console.log('lineHeight',textLines[index].text,lineHeight)
          const { text, offset, isBullet,isSubBullet } = textLines[index];

          // console.log('salto de pagina texto',opts.y + (index + 1) * lineHeight > (pageHeigth+10))

  
          if (opts.y + (index + 1) * lineHeight > (pageHeigth+10)) {
              pdf.addPage();
              addFooterAndTitle();
              opts.y = -18;
              index--;
              continue;
          }
  
          let offset2 = 0;
          if (!text.startsWith('• ') && offset > 0) {
              offset2 = 2.9;
          }
  
          if (isBullet) {
              pdf.setFontSize(12);  // Tamaño de fuente más grande para el bullet
              let icon = '•'
              if(isSubBullet){
                icon = '\u2022'
              }
              pdf.text(icon, opts.x + this.horizontalMargin + offset, opts.y + this.verticalMargin + lineHeight * (index + 1) / 2, { align: opts.textAlign });
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

  _addFormatedText2(opts: textOpts, pdf: jsPDF): number {
    const imgWidth = 30;
    const imgHeight = imgWidth / 4.65517241379;

    const pageHeigth = pdf.internal.pageSize.height; //297mm
    const pageWidth = pdf.internal.pageSize.width; //210mm

    const addFooterAndTitle = () => {
        let oldFontSize = pdf.getFontSize();
        
        const posY = pageHeigth - imgHeight - 5;
        const maxTextWidth = pageWidth - imgWidth - 15;
        let courseTitle = opts?.course?.titulo?  opts?.course?.titulo: opts.tituloFooter;

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
        pdf.text(textoEmpresa, pageWidth - margen, (posY + imgHeight / 2) + 2, { align: 'left' });
        pdf.setFontSize(oldFontSize);
    };

    if (opts.y > pageHeigth - 30) {
        pdf.addPage();
        addFooterAndTitle();
        opts.y = 15;
    }

    pdf.setFont("Roboto", opts?.bold ? "bold" : "normal");
    if (opts?.size) {
        pdf.setFontSize(opts.size);
    }

    opts.color == 'white' ? pdf.setTextColor(255, 255, 255) : pdf.setTextColor(0, 0, 0);

    const maxLineWidth = opts?.maxLineWidth ? opts.maxLineWidth : pageWidth - this.horizontalMargin * 2;

    let textLines = [];
    const paragraphs = opts.text.split('\n');

    for (const paragraph of paragraphs) {
        let offset = 0;
        let isBullet = false;
        let isSubBullet = false;


        let formattedParagraph = paragraph;
        if (formattedParagraph.trim().startsWith('*')) {
            formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
            offset = 5;
            isBullet = true;
        }

        if (formattedParagraph.trim().startsWith('>')) {
          formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
          offset = 8;
          isBullet = true;
          isSubBullet = true
      }

        const lines = pdf.splitTextToSize(formattedParagraph, maxLineWidth);
        lines.forEach((line, index) => {
            textLines.push({
                text: line,
                offset: isBullet ? offset : 0,
                isBullet: isBullet && index === 0,  // Solo la primera línea del bullet
                isSubBullet:isSubBullet,
            });
        });
    }

    const lineSpacingFactor = opts.lineSpacingFactor ?? 1;

    for (let index = 0; index < textLines.length; index++) {
        const lineHeight = pdf.getLineHeight() * lineSpacingFactor;
        const currentFontSize = pdf.getFontSize();

        const lineHeight2 = currentFontSize * 0.35 * lineSpacingFactor; // Ajustar el multiplicador según el espaciado deseado
        console.log('lineHeight',textLines[index].text,lineHeight)
        const { text, offset, isBullet,isSubBullet } = textLines[index];

        // console.log('salto de pagina texto',opts.y + (index + 1) * lineHeight > (pageHeigth+10))


        if (opts.y + (index + 1) * lineHeight > (pageHeigth+10)) {
            pdf.addPage();
            addFooterAndTitle();
            if(isBullet || isSubBullet){
              opts.y = -20;
            }
            else{
              opts.y = -10;
            }
            index--;
            continue;
        }

        let offset2 = 0;
        if (!text.startsWith('• ') && offset > 0) {
            offset2 = 2.9;
        }

        if (isBullet) {
            pdf.setFontSize(12);  // Tamaño de fuente más grande para el bullet
            let icon = '•'
            if(isSubBullet){
              icon = '\u2022'
            }
            pdf.text(icon, opts.x + this.horizontalMargin + offset, opts.y + this.verticalMargin + lineHeight * (index + 1) / 2, { align: opts.textAlign });
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


  _addFormatedTextP21(opts: textOpts, pdf: jsPDF): number {

    const horizontalMargin = 10
    const verticalMargin = 4

    const imgWidth = 30;
    const imgHeight = imgWidth / 4.65517241379;

    const pageHeigth = pdf.internal.pageSize.height; //297mm
    const pageWidth = pdf.internal.pageSize.width; //210mm

    const addFooterAndTitle = () => {
        let oldFontSize = pdf.getFontSize();
        
        const posY = pageHeigth - imgHeight - 5;
        const maxTextWidth = pageWidth - imgWidth - 15;
        let courseTitle = opts?.course?.titulo?  opts?.course?.titulo: opts.tituloFooter;

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
        pdf.text(textoEmpresa, pageWidth - margen, (posY + imgHeight / 2) + 2, { align: 'left' });
        pdf.setFontSize(oldFontSize);
    };

    if (opts.y > pageHeigth - 30) {
        pdf.addPage();
        addFooterAndTitle();
        opts.y = 15;
    }

    pdf.setFont("Roboto", opts?.bold ? "bold" : "normal");
    if (opts?.size) {
        pdf.setFontSize(opts.size);
    }

    opts.color == 'white' ? pdf.setTextColor(255, 255, 255) : pdf.setTextColor(0, 0, 0);

    const maxLineWidth = opts?.maxLineWidth ? opts.maxLineWidth : pageWidth - horizontalMargin * 2;

    let textLines = [];
    const paragraphs = opts.text.split('\n');

    for (const paragraph of paragraphs) {
        let offset = 0;
        let isBullet = false;
        let isSubBullet = false;


        let formattedParagraph = paragraph;
        if (formattedParagraph.trim().startsWith('*')) {
            formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
            offset = 5;
            isBullet = true;
        }

        if (formattedParagraph.trim().startsWith('>')) {
          formattedParagraph = `• ${formattedParagraph.trim().slice(1).trim()}`;
          offset = 8;
          isBullet = true;
          isSubBullet = true
      }

        const lines = pdf.splitTextToSize(formattedParagraph, maxLineWidth);
        lines.forEach((line, index) => {
            textLines.push({
                text: line,
                offset: isBullet ? offset : 0,
                isBullet: isBullet && index === 0,  // Solo la primera línea del bullet
                isSubBullet:isSubBullet,
            });
        });
    }

    const lineSpacingFactor = opts.lineSpacingFactor ?? 1;

    const currentFontSize = pdf.getFontSize();
    const lineHeight = currentFontSize * 0.35 * lineSpacingFactor; // Ajustar el multiplicador según el espaciado deseado

    for (let index = 0; index < textLines.length; index++) {
      // Usar el tamaño de fuente actual para calcular lineHeight

  
      const { text, offset, isBullet, isSubBullet } = textLines[index];
  
      // Verificar si es necesario un salto de página
      if (opts.y + lineHeight > pageHeigth - 90) { // Restar el margen inferior
          pdf.addPage();
          addFooterAndTitle();
          opts.y = -55; // Reiniciar la posición en la nueva página
          index--; // Reprocesar la línea actual
          continue;
      }

      let offset2 = 0;
      if (!text.startsWith('• ') && offset > 0) {
          offset2 = 3; // Ajustar el espacio según sea bullet o sub-bullet
      }

      if (isBullet) {
          pdf.setFontSize(12); // Tamaño de fuente para el bullet
          const icon = isSubBullet ? '\u2022' : '•';
          
          // Primera línea del bullet
          pdf.text(
              icon,
              opts.x + horizontalMargin + offset,
              opts.y + verticalMargin + lineHeight * (index + 1) / 2,
              { align: opts.textAlign }
          );

          pdf.setFontSize(opts.size); // Restaurar tamaño de fuente normal
          pdf.text(
              text.slice(2).trim(),
              opts.x + horizontalMargin + offset + 3, // Ajustar posición del texto después del bullet
              opts.y + verticalMargin + lineHeight * (index + 1) / 2,
              { align: opts.textAlign }
          );
      } else {
          // Texto normal y líneas adicionales del bullet
          pdf.text(
              text,
              opts.x + horizontalMargin + offset + offset2,
              opts.y + verticalMargin + lineHeight * (index + 1) / 2,
              { align: opts.textAlign }
          );
      }

      opts.y += lineHeight;
  }
  

    let nextHeightValue = opts.y + textLines.length * lineHeight / 2;
    console.log('nextHeightValue',nextHeightValue)
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

  async downloadCalendarioP21(meses,year,titulo='Ficha_tecnica_Cursos',showLoading = true) {


    

    console.log(meses)

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

    this.pageHeigth = pdf.internal.pageSize.height; //297mm
    this.pageWidth = pdf.internal.pageSize.width; //210mm
  
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
    pdf.addFileToVFS("Roboto-Bold.ttf", robotoBold);
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");


    const imgWidtLogoWhiteInit = 60; // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhiteInit = imgWidtLogoWhiteInit / 4.3;

    // Ajustar el fondo de color para cubrir hasta un poco debajo del último logo
    pdf.setFillColor(21, 61, 100);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 35, 'F');

    pdf.addImage(this.logoWhiteP21, 'png', 10, 9, imgWidtLogoWhiteInit, imgHeightLogoWhiteInit, '', 'SLOW');


    pdf.setFont("Roboto", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);  // Ajustar el tamaño de la fuente

    pdf.text('CALENDARIO DE CURSOS',134,10);
    pdf.text('En línea, en vivo',162,18);
    pdf.setFontSize(30);  // Ajustar el tamaño de la fuente
    pdf.text(String(year),184,30);

  let currentLine = 40


  for (let i = 0; i < meses.length; i++) {

    const mes = meses[i]

    let table ={
      titulo:'TEST',
      modules:[mes]
    }

    console.log('table',table)

    currentLine = currentLine+4
    currentLine = await this.addFormattedTable(table, currentLine, pdf,true,true,true);

  }

    // pdf.addPage();

    pdf.save(`${this.sanitizeFilename(titulo)}.pdf`);

    if(showLoading){
      Swal.close();
    }

    
    
  }




  
}