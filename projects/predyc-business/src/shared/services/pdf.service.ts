import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { robotoBold } from '../../assets/fonts/Roboto/Roboto-bold';
import { robotoRegular } from '../../assets/fonts/Roboto/Roboto-normal';
import Swal from "sweetalert2";


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
    course?:any
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
      pdf.addImage(circularImage, 'PNG', 58.5, startY + (sectionHeight - imageSize) / 2, imageSize, imageSize, '', 'FAST');
  
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

  async downloadFichaTecnica(course, instructor, pdf: jsPDF = null, addToDocument: boolean = false) {
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
  
    pdf.addImage(imgData, 'PNG', 6, 5, 45, 45, '', 'FAST');
  
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
    pdf.text(`Predyc`, this.pageWidth-20, (posY + imgHeight / 2) + 2, { align: 'left' });
  
    const imgWidtLogoWhite = 27;  // Puedes ajustar este valor según tus necesidades
    const imgHeightLogoWhite = imgWidtLogoWhite / 4.3;
  
    pdf.addImage(this.logoWhite, 'png', 180, 3, imgWidtLogoWhite, imgHeightLogoWhite, '', 'FAST');
  
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
  
    pdf.addImage(this.reloj, 'png', 57.69, 45.02, 6, 6, '', 'FAST');
  
    currentLine = this.addFormatedText({
      text: `Duración del curso: ${duracionCurso}`,
      course: course,
      x: 55,
      y: 40.5,
      size: 8,
      color: 'white',
      bold: true,
      textAlign: "left",
      maxLineWidth: this.pageWidth - 120
    }, pdf);
  
    pdf.setFontSize(16);
  
    pdf.setFontSize(14);
    currentLine = 53;
    currentLine = this.addFormatedText({
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
    currentLine = this.addFormatedText({
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
    currentLine = this.addFormattedTable(course, currentLine, pdf);
  
    if (!addToDocument) {
      pdf.save("Ficha_tecnica_Curso_" + this.sanitizeFilename(course.titulo) + ".pdf");
    }
  }

  async downloadFichaTecnicaMultiple(courses) {

    Swal.fire({
      title: "Generando Catálogo...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const pdf = new jsPDF("p", "mm", "a4", true) as jsPDF;
  
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  
    pdf.addFileToVFS("Roboto-Bold.ttf", robotoBold);
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const instructor = course.instructorData; // Suponiendo que tienes una manera de obtener el instructor para cada curso
      console.log(course, instructor);
      await this.downloadFichaTecnica(course, instructor, pdf, true);
      
      if (i < courses.length - 1) {
        pdf.addPage(); // Solo agregar una nueva página si no es el último curso
      }
    }
    pdf.save("Ficha_tecnica_Cursos.pdf");
    Swal.close();

  }
  
  
    removeAccents(str: string): string {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    // Función para sanitizar el nombre del archivo
    sanitizeFilename(name: string): string {
      const nameWithoutAccents = this.removeAccents(name);
      return nameWithoutAccents.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
  
    getFormattedDuration(tiempo) {
      if(!tiempo){
        return ''
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
  
    addFormattedTable(course: any, currentLine: number, pdf: jsPDF): number {
      const imgWidth = 30;  // Puedes ajustar este valor según tus necesidades
      const imgHeight = imgWidth / 4.65517241379;
      const tableMargin = this.pageWidth * 0.05; // Márgenes para centrar la tabla (5% de cada lado)
      const tableWidth = this.pageWidth * 0.9; // Ancho de la tabla (90% del ancho de la página)
      const headerHeight = 8; // Altura del encabezado del módulo
      const classHeight = 6.8; // Altura de las clases
    
      course.modules.forEach((modulo, moduleIndex) => {
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
              pdf.text(modulo.titulo.trim(), tableMargin + 3, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              if (showDuration) {
                  let duracion = 0;
                  modulo.clases.forEach(clase => {
                      duracion += clase.duracion;
                  });
                  let duracionModulo = this.getFormattedDuration(duracion);
                  if (duracion > 60) {
                      pdf.text(`${duracionModulo}`, 179, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                  } else if (duracion % 60 == 0) {
                      pdf.text(`${duracionModulo}`, 186, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                  } else {
                      pdf.text(`${duracionModulo}`, 183, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
                  }
              }
              currentLine += headerHeight; // Espacio entre el encabezado y la primera clase
              // Dibujar línea gruesa debajo del encabezado del módulo
              pdf.line(tableMargin, currentLine, tableMargin + tableWidth, currentLine);
          };
    
          // Verificar si se necesita una nueva página antes de dibujar el encabezado del módulo
          if (currentLine > this.pageHeigth - 25) {
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
              pdf.text(`Predyc`, this.pageWidth-20, (posY + imgHeight / 2) + 2, { align: 'left' });
              //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'FAST');
    
              currentLine = 15;
              pdf.setFontSize(old);
          }
    
          drawModuleHeader(true);
    
          // Dibujar clases del módulo
          modulo.clases.forEach((clase, index) => {
              const textYPosition = currentLine + (classHeight / 2) + 1; // Ajuste para centrar verticalmente el texto
              pdf.setFont("Roboto", "normal");
              pdf.setFontSize(8);
              pdf.setTextColor(0, 0, 0);
              let duracionClase = this.getFormattedDuration(clase.duracion);
              let tituloClase = clase.titulo.trim();
              if (tituloClase.length >= 125) {
                  tituloClase = tituloClase.slice(0, 122) + '...';
              }
              pdf.text(`${tituloClase}`, tableMargin + 5, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              if (clase.duracion >= 10 && clase.duracion % 60 != 0) {
                  pdf.text(`${duracionClase}`, 185, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              } else if (clase.duracion % 60 == 0) {
                  pdf.text(`${duracionClase}`, 186, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
              } else {
                  pdf.text(`${duracionClase}`, 186, textYPosition, { align: 'left' }); // Centrar el texto verticalmente
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
                      while (pdf.getTextWidth(courseTitle) > maxTextWidth) {
                          courseTitle = courseTitle.slice(0, -1);  // Recortar el texto
                      }
    
                      const textWidth = pdf.getTextWidth(courseTitle);
    
                      pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
                      pdf.setFont("Roboto", "normal");
                      pdf.setTextColor(0, 0, 0);
                      pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
                      pdf.setFontSize(9);  // Ajustar el tamaño de la fuente
                      pdf.text(`Predyc`, this.pageWidth-20, (posY + imgHeight / 2) + 2, { align: 'left' });
                      //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'FAST');
    
                      currentLine = 15;
                      pdf.setFontSize(old);
    
                      if (index < modulo.clases.length - 1) {
                          drawModuleHeader(false); // Redibujar encabezado del módulo en la nueva página si hay más clases
                      }
                  }
              }
          });
    
          currentLine += 0; // Espaciado entre módulos
      });
    
      return currentLine;
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

        pdf.setFontSize(8);  // Ajustar el tamaño de la fuente
        pdf.setFont("Roboto", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${courseTitle} - ${this.fecha}`, 6, (posY + imgHeight / 2) + 2, { align: 'left' });
        //pdf.addImage(this.logoBlack, 'png', this.pageWidth - imgWidth - 5, posY, imgWidth, imgHeight, '', 'FAST');
        pdf.setFontSize(9);  // Ajustar el tamaño de la fuente
        pdf.text(`Predyc`, this.pageWidth-20, (posY + imgHeight / 2) + 2, { align: 'left' });

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