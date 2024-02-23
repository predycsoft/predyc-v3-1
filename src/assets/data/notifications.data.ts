import { NotificationJson } from "src/shared/models/notification.model";

const notificationTypes = ['alert', 'event'];
const alertSubTypes = ['delayed', 'pending'];
const eventSubTypes = ['succeded'];
const randomCourse = ['Planificacion de mantenimiento', 'Analisis causa raiz', 'Gestion de riesgo', 'Herramientas de planeamiento', 'Gestion de costo de mantenimiento'];
const randomCertification = ['Programa 1', 'Programa 2', 'Programa 3'];

function getRandomType() {
  const randomIndex = Math.floor(Math.random() * notificationTypes.length);
  return notificationTypes[randomIndex];
}

function getRandomSubType(type) {
  let subTypes = type === 'alert' ? alertSubTypes : eventSubTypes;
  const randomIndex = Math.floor(Math.random() * subTypes.length);
  return subTypes[randomIndex];
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
  const subType = getRandomSubType(type);

  let message;
  if (type === 'event') {
    message = "ha completado su plan de estudios.";
  } else if (type === 'alert') {
    if (subType === 'delayed') {
      message =   "esta atrasado en su plan de estudios.";
    } else {
      message =   "tiene una suscripción que expira en 5 dias.";
    }
  }

  const now = new Date();
  const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 30)).getTime();
  
  return {
    id: null,
    // readByUser: false,
    // readByAdmin: false,
    message,
    readByUser: null,
    clearByUser: null,
    date: timestamp,
    userRef: null,
    enterpriseRef: null,
    type,
    subType
  };
}

export const notificationsData = Array.from({ length: 30 }, () => generateNotification());