import { NotificationJson } from "src/app/shared/models/notification.model";

const notificationTypes = ['alert', 'event'];
const randomCourse = ['Planificacion de mantenimiento', 'Analisis causa raiz', 'Gestion de riesgo', 'Herramientas de planeamiento', 'Gestion de costo de mantenimiento'];
const randomCertification = ['Programa 1', 'Programa 2', 'Programa 3'];

function getRandomType() {
  const randomIndex = Math.floor(Math.random() * notificationTypes.length);
  return notificationTypes[randomIndex];
}

function getRandomCourse() {
  const randomIndex = Math.floor(Math.random() * randomCourse.length);
  return randomCourse[randomIndex];
}

function getRandomCertification() {
  const randomIndex = Math.floor(Math.random() * randomCertification.length);
  return randomCertification[randomIndex];
}

function generateNotification(): NotificationJson {
  const type = getRandomType();
  let message;
  if (type === 'event') {
    const randomBool = Math.random() < 0.5;
    if (randomBool) {
      message = 'ha completado el diagnostico inicial de ' + getRandomCourse();
    } else {
      message = 'esta solicitando acceso al diplomado ' + getRandomCertification();
    }
  } else if (type === 'alert') {
    message = `tiene ${Math.floor(Math.random() * 20) + 1} horas de retraso en el curso ${getRandomCourse()}`;
  }

  const now = new Date();
  const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 30)).getTime();
  return {
    id: null,
    readByUser: false,
    readByAdmin: false,
    message,
    date: timestamp,
    userRef: null,
    enterpriseRef: null,
    type
  };
}

export const notificationsData = Array.from({ length: 30 }, () => generateNotification());
// console.log(notificationsData)
// export const notificationsData: NotificationJson[] = [
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1695217180,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "ha completado el diagnostico inicial de Direccion de Proyectos",
//     date: 1695130780,
//     userRef: null,
//     enterpriseRef: null,
//     type: "activity" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1695134380,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1695141580,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694968780,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1694363980,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694018380,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1695141580,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694968780,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1694363980,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694018380,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694968780,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
//     date: 1694363980,
//     userRef: null,
//     enterpriseRef: null,
//     type: "alert" 
//   },
//   {
//     id: null,
//     readByUser:  false,
//     readByAdmin: false,
//     message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
//     date: 1694018380,
//     userRef: null,
//     enterpriseRef: null,
//     type: "request"
//   }
// ]