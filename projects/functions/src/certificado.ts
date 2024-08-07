import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Enterprise, User,Curso, Clase, Modulo, LiveCourse,titleCaseWithExceptions} from 'shared';
import { _sendMailHTML } from './email';
import fetch from 'node-fetch';
import jspdf, { ImageOptions, jsPDF } from 'jspdf';
const sharp = require('sharp');


const db = admin.firestore();


const firma = `<p>Saludos cordiales,</p>
<img src="https://predictiva21.com/wp-content/uploads/2024/06/LOGOPREDYC-BACKWHITE.webp" alt="Predyc" style="width: 150px; height: auto;">`;
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

const title = 'ngsdfsdf';
const imgCurso: string = "https://predyc-user.web.app/assets/images/cursos/curso1.jpg"
const backCertificado: string = "https://predyc-user.web.app/assets/images/certificado/certificado.png"
const backCertificado2: string = "https://predyc-user.web.app/assets/images/certificado/certificado-2.png"
const backCertificadoTractian: string = "https://predyc-user.web.app/assets/images/certificado/certificado-tractian.png"
const skeleton: string = "https://predyc-user.web.app/assets/images/certificado/skeletonCertificate.png"
const firmaCEO: string = "https://predyc-user.web.app/assets/images/certificado/firma-ceo.png"
const firmaCOO: string = "https://predyc-user.web.app/assets/images/certificado/firma-coo.png"
const certificado = "https://predyc-user.web.app/assets/images/logos/certificado.avif"


let nombreInstructor;
let dataInstructorGlobal
let imgTest;
let instructorEmpresaNombre: string;


let fecha: Date;
let fechaTransformada;
let firmaInstructor;
let logoInstructorEmpresa;
let logoUsuarioEmpresa;
let duracionCurso;
let nombreUsuario
let mostrarLogoUsuarioEmpresa: boolean

let tituloCurso
let descripcionCurso
let horas: string = 'hora';
let tipo = 'curso'
let id

async function downloadImage(url: string): Promise<Buffer> {
    console.log('downloadImage:',url)
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.buffer();
  }

export const generateMailCertificate = functions.https.onCall(async (data, _) => {
    try {
      id = data.idCertificate;
      const userCertificateRef = admin.firestore().collection('userCertificate').doc(id);
      const userCertificateDoc = await userCertificateRef.get();
  
      if (!userCertificateDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró el certificado del usuario.');
      }
  
      const userCertificateData = userCertificateDoc.data();
      fecha = userCertificateData['date'].toDate();
      fechaTransformada = fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const usuarioId = userCertificateData['usuarioId'];
      const diplomadoId = userCertificateData['diplomadoId'];
      const cursoId = userCertificateData['cursoId'];
      const liveCourseId = userCertificateData['liveCourseId'];
  
      const userRef = admin.firestore().collection(User.collection).doc(usuarioId);
      const userDoc = await userRef.get();
  
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró el usuario.');
      }
  
      let enterpriseId: string = null;
      const dataUser = userDoc.data();
      nombreUsuario = titleCaseWithExceptions(dataUser["displayName"]);
      enterpriseId = dataUser["enterprise"]?.id;
  
      if (enterpriseId) {
        const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
        const enterpriseDoc = await enterpriseRef.get();
  
        if (!enterpriseDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'No se encontró la empresa.');
        }
        const dataEnterprise = enterpriseDoc.data();
        if(!dataEnterprise.congratulationsEndCourse){
          throw new functions.https.HttpsError('not-found', 'Empresa sin corrreo final cursos');
        }
        logoUsuarioEmpresa = dataEnterprise["photoUrl"];
        mostrarLogoUsuarioEmpresa = dataEnterprise["showEnterpriseLogoInCertificates"];
        
        // Redimensionar la imagen del logo del usuario
        // Descargar y redimensionar la imagen del logo del usuario
        if (logoUsuarioEmpresa) {
            const imgBuffer = await downloadImage(logoUsuarioEmpresa);
            if(imgBuffer){
                const resizedBuffer = await sharp(imgBuffer).toBuffer();
                logoUsuarioEmpresa = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
            }
            else{
                logoUsuarioEmpresa = null
            }

        }
      }
  
      if (diplomadoId) {
        throw new functions.https.HttpsError("not-found", 'not yet implemented');
      } else if (cursoId) {
        const dataCurso = await getCourseById(cursoId);
        tituloCurso = dataCurso['titulo'];
        descripcionCurso = dataCurso['resumen'];
        let modulos = dataCurso['modules'];
        let duracionCourse = 0;
  
        modulos.forEach(modulo => {
          modulo.expanded = false;
          let duracion = 0;
          modulo.clases.forEach(clase => {
            duracion += clase.duracion;
          });
          modulo.duracion = duracion;
          duracionCourse += duracion;
        });
        dataCurso['duracion'] = duracionCourse;
        duracionCurso = parseFloat(Math.ceil(dataCurso['duracion'] / 60).toFixed(0));
        if (duracionCurso >= 2) { horas = 'horas'; }
        const instructorId = dataCurso['instructorRef'].id;
        const instructorRef = admin.firestore().collection('instructors').doc(instructorId);
        const instructorDoc = await instructorRef.get();
        if (!instructorDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'No se encontró el instructor.');
        }
        const dataInstructor = instructorDoc.data();
        dataInstructorGlobal = dataInstructor
        nombreInstructor = dataInstructor['nombre'];
        firmaInstructor = dataInstructor['firma'];
        logoInstructorEmpresa = dataInstructor['empresaFoto'];
        instructorEmpresaNombre = dataInstructor['empresaNombre'];
        // Redimensionar la imagen del logo del instructor
        if (logoInstructorEmpresa) {
            const imgBuffer = await downloadImage(logoInstructorEmpresa);
            if(imgBuffer){
                const resizedBuffer = await sharp(imgBuffer).toBuffer();
                logoInstructorEmpresa = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
            }
            else{
                logoInstructorEmpresa = null
            }

        }
        if(firmaInstructor){

          const imgBuffer = await downloadImage(firmaInstructor);
          if(imgBuffer){
              const resizedBuffer = await sharp(imgBuffer).toBuffer();
              firmaInstructor = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
          }
          else{
            firmaInstructor = null
          }


        }

      } else if (liveCourseId) {
        // throw new functions.https.HttpsError("not-found", 'not yet implemented');
        const dataCurso = await getLiveCourseById(liveCourseId);

        console.log(dataCurso)
        tituloCurso = dataCurso['title'];
        descripcionCurso = dataCurso['identifierText'];
  
        duracionCurso = parseFloat(Math.ceil(dataCurso['duration'] / 60).toFixed(0));
        dataCurso['duration'] = duracionCurso;

        if (duracionCurso >= 2) { horas = 'horas'; }
        const instructorId = dataCurso['instructorRef'].id;
        const instructorRef = admin.firestore().collection('instructors').doc(instructorId);
        const instructorDoc = await instructorRef.get();
        if (!instructorDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'No se encontró el instructor.');
        }
        const dataInstructor = instructorDoc.data();
        dataInstructorGlobal = dataInstructor
        nombreInstructor = dataInstructor['nombre'];
        firmaInstructor = dataInstructor['firma'];
        logoInstructorEmpresa = dataInstructor['empresaFoto'];
        instructorEmpresaNombre = dataInstructor['empresaNombre'];
        // Redimensionar la imagen del logo del instructor
        if (logoInstructorEmpresa) {
            const imgBuffer = await downloadImage(logoInstructorEmpresa);
            if(imgBuffer){
                const resizedBuffer = await sharp(imgBuffer).toBuffer();
                logoInstructorEmpresa = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
            }
            else{
                logoInstructorEmpresa = null
            }

          }
          if(firmaInstructor){

            const imgBuffer = await downloadImage(firmaInstructor);
            if(imgBuffer){
                const resizedBuffer = await sharp(imgBuffer).toBuffer();
                firmaInstructor = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
            }
            else{
              firmaInstructor = null
            }
  
  
          }
      }
  
      const pdf = await generatePDF()
      const sender = "capacitacion@predyc.com";
      // const recipients = ['arturo.romero@predyc.com'];
      const recipients =  [dataUser['email']]
      const subject = `Has aprobado el ${tipo} ${tituloCurso} en PREDYC`;
      let correo = `<strong>${titleCaseWithExceptions(nombreUsuario)}</strong>,</p><p>Felicidades por haber completado el ${tipo} <strong>${tituloCurso} en PREDYC.</strong> Puedes ver y compartir tu certificado siguiendo este enlace: <a href="https://predyc-user.web.app/certificado/${id}">Ver certificado en línea</a>.</p>
      <p>También puedes ver tu certificado adjunto en este correo.</p>`;
      let htmlMailFinal = `<!DOCTYPE html><html><head></head><body><p>${correo}<br>${firma}</body></html>`;
      const htmlContent = htmlMailFinal;
      const adjunto = pdf
      const cc = ["capacitacion@predyc.com"];
      const mailObj = { sender, recipients, subject, cc, htmlContent,adjunto };
      //console.log(mailObj)
      _sendMailHTML(mailObj);

    } catch (error: any) {
      console.log(error);
      throw new functions.https.HttpsError("unknown", error.message);
    }
  });

  async function getLiveCourseById(courseId: string): Promise<any> {
    try {
      // Fetch the course data
      const courseDoc = await admin.firestore().collection(LiveCourse.collection).doc(courseId).get();
      if (!courseDoc.exists) {
        throw new Error('No se encontró el curso.');
      }
      const courseData = courseDoc.data();
  
      return courseData;
    } catch (error) {
      console.error('Error al obtener los datos del curso:', error);
      throw error;
    }
  }

async function getCourseById(courseId: string): Promise<any> {
    try {
      // Fetch the course data
      const courseDoc = await admin.firestore().collection(Curso.collection).doc(courseId).get();
      if (!courseDoc.exists) {
        throw new Error('No se encontró el curso.');
      }
      const courseData = courseDoc.data();
  
      // Fetch all classes
      const classesSnapshot = await admin.firestore().collection(Clase.collection).get();
      const allClasses = classesSnapshot.docs.map(doc => doc.data());
  
      // Fetch modules for this course
      const modulesSnapshot = await admin.firestore().collection(`${Curso.collection}/${courseId}/${Modulo.collection}`).get();
      const modules = modulesSnapshot.docs.map(doc => doc.data());
  
      // Attach the relevant classes to each module
      const modulesWithClasses = modules.map(module => {
        const classes = module['clasesRef'].map(claseRef => 
          allClasses.find(clase => clase.id === claseRef.id)
        );
        return { ...module, clases: classes };
      });
  
      return { ...courseData, modules: modulesWithClasses };
    } catch (error) {
      console.error('Error al obtener los datos del curso:', error);
      throw error;
    }
  }

  async function generatePDF(): Promise<{ filename: string, content: string }> {
    const doc = new jsPDF('l', 'mm', [297, 210]);

    const imgBufferbackCertificado = await downloadImage(backCertificado);
    const bufferbackCertificado = await sharp(imgBufferbackCertificado).toBuffer();
    const backCertificadoBase64 = `data:image/png;base64,${bufferbackCertificado.toString('base64')}`;
  
    doc.addImage(backCertificadoBase64, 'PNG', 0, 0, 297, 210,'','FAST');
    doc.setFontSize(27);
    doc.setTextColor(21, 27, 38);
    doc.setFont('helvetica', 'bold');
    if(nombreUsuario>=40){
			doc.setFontSize(nombreUsuario/1.8) // mejorar 
		}
    doc.text(nombreUsuario, 19, 80); // Nombre usuario
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(156, 166, 175);
    doc.text('Por completar exitosamente el '+tipo+' en línea con duración de ' + duracionCurso + ' ' + horas , 19, 91) // Nombre usuario
    doc.setFontSize(19);
    doc.setTextColor(100, 111, 121);
    const tituloCursoSplit = doc.splitTextToSize(tituloCurso, 170);
    doc.text(tituloCursoSplit, 19, 101);
    doc.setFontSize(15);
  
// Agregar imágenes redimensionadas en base64
    if (mostrarLogoUsuarioEmpresa) {
      if (logoUsuarioEmpresa) {
          const dimensions = await getImageDimensions(logoUsuarioEmpresa);
          doc.addImage(logoUsuarioEmpresa, 'PNG', 17, 10, 50, dimensions.height,'','FAST');
      } else if (logoInstructorEmpresa) {
          const dimensions = await getImageDimensions(logoInstructorEmpresa);
          doc.addImage(logoInstructorEmpresa, 'PNG', 17, 10, 50, dimensions.height,'','FAST');;
      }
    } else {
      if (logoInstructorEmpresa) {
          const dimensions = await getImageDimensions(logoInstructorEmpresa);
          doc.addImage(logoInstructorEmpresa, 'PNG', 17, 10, 50, dimensions.height,'','FAST');
      }
    }

    doc.setTextColor(132, 143, 153);
    doc.setFontSize(12);


    // if(firmaInstructor){
    //   const dimensions = await getImageDimensionsSignature(firmaInstructor,70,30);
    //   doc.addImage(firmaInstructor, 'PNG', 110, 136, 40, dimensions.height,'','FAST');
    //   doc.line(100, 160, 171,160);
    //   doc.setFont('helvetica', 'bold')
    //   doc.text(nombreInstructor, 100, 168)
    //   doc.setFont('helvetica', 'normal')
    //   doc.text('Instructor', 100, 175)
    // }
    if (firmaInstructor) {
      const dimensions = await getImageDimensionsSignature(firmaInstructor, 70, 30);
  
      // Coordenadas de la línea y el texto
      const xLinea = 100;
      const yLinea = 160;
      const yNombre = 168;
      const yTitulo = 175;
  
      // Ajustar la coordenada y de la firma para que se alinee con la línea
      const yFirma = yLinea - dimensions.height;
  
      // Añadir la imagen de la firma
      doc.addImage(firmaInstructor, 'PNG', xLinea, yFirma+4, dimensions.width, dimensions.height, '', 'FAST');
  
      // Dibujar la línea
      doc.line(xLinea, yLinea, 171, yLinea);
  
      // Añadir el nombre del instructor
      doc.setFont('helvetica', 'bold');
      doc.text(nombreInstructor, xLinea, yNombre);
  
      // Añadir el título del instructor
      doc.setFont('helvetica', 'normal');
      doc.text('Instructor', xLinea, yTitulo);
    }
  
    
    doc.setFont('helvetica', 'bold');
    let imgBufferfirmaCEO = await downloadImage((dataInstructorGlobal.id == 'RW5RwaDyai2gvoKNhnlo')?firmaCOO:firmaCEO);
    
    const bufferfirmaCEO = await sharp(imgBufferfirmaCEO).toBuffer();
    const firmaCEOBase64 = `data:image/png;base64,${bufferfirmaCEO.toString('base64')}`;
    
    doc.addImage(firmaCEOBase64, 'PNG', 12, 136, 80, 30,'','FAST');


    if(dataInstructorGlobal.id == 'RW5RwaDyai2gvoKNhnlo'){
      doc.text('Alejandro Godoy', 19, 168);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('COO de Predyc', 19, 175);
    }
    else{
      doc.text('Andrés Enrique González Giraldo', 19, 168);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('CEO de Predyc', 19, 175);
    }
    doc.line(19, 160, 80,160);

    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    if (nombreInstructor && !firmaInstructor) {
      doc.text('Instructor: ' + nombreInstructor, 19, 120);
    }
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.text(fechaTransformada, 19, 190);
    doc.setFontSize(11);
    doc.text('Certificado por Predyc. Código de certificado: ' + id, 19, 197);
    const pdfDataUri = doc.output('datauristring');
    const base64Content = pdfDataUri.split(',')[1];

    const fileName = "Certificado "+titleCaseWithExceptions(nombreUsuario)+" - "+tituloCurso+'.pdf'


    return {
        filename: fileName,
        content: base64Content
    }; 
 }
  
 async function getImageDimensions(base64Image: string,tamano:number = 50): Promise<{ width: number, height: number }> {
    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
    const metadata = await sharp(buffer).metadata();
    const aspectRatio = metadata.width / metadata.height;
    const width = tamano;
    const height = width / aspectRatio;
    return { width, height };
}

async function getImageDimensionsSignature(base64Image: string, maxAncho: number = 50, maxAlto: number = 40): Promise<{ width: number, height: number }> {
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
  const metadata = await sharp(buffer).metadata();
  const aspectRatio = metadata.width / metadata.height;
  let width = metadata.width;
  let height = metadata.height;

  if (width > maxAncho) {
      width = maxAncho;
      height = width / aspectRatio;
  }

  if (height > maxAlto) {
      height = maxAlto;
      width = height * aspectRatio;
  }

  return { width, height };
}