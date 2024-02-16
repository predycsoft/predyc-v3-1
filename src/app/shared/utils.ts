export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const dateFromCalendarToTimestamp = (date: {day: number, month: number, year: number}): number => {
    return Date.UTC(date.year, date.month - 1, date.day); 
}

export const generateSixDigitRandomNumber = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

export const timestampToDateNumbers = (timestamp: number): {minutes:number, hours:number, day:number, month:number, year:number } => {
    const date: Date = new Date(timestamp); 
    const minutes: number = date.getUTCMinutes()
    const hours: number = date.getUTCHours();
    const day: number = date.getUTCDate();
    const month: number = date.getUTCMonth() + 1;
    const year: number = date.getUTCFullYear();
    return {minutes, hours, day, month, year}
}

export const orderByValueAndDirection = (a: number|string, b: number|string, isAsc: boolean) => {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

export const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64content = event.target.result.split(',')[1];
        resolve(base64content);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
}

export const compareByString = (a: string, b: string): number => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
};

export const getPlaceholders = (text: string): string[] => {
  let placeholders = [];
  let matches = text.matchAll(/\[([^\[\]]*)\]/g);
  for (let match of matches) {
    placeholders.push(match[1]);
  }
  return placeholders;
}

export const cloneArrayOfObjects = (inputArray: Object[]): Object[] => {
  return inputArray.map(obj => {
    return {...obj}
  })
}

export const roundNumber = (num: number): number => {
  return Math.round(num);
}

export const firestoreTimestampToNumberTimestamp = (timestamp: {seconds: number, miliseconds: number} | null): number | null => {
  if (timestamp) return timestamp.seconds * 1000
  return null
}

export const splitArray = (array, numArrays) => {
  const chunkSize = Math.ceil(array.length / numArrays);
  return Array.from({ length: numArrays }, (_, index) =>
      array.slice(index * chunkSize, (index + 1) * chunkSize)
  );
}

// Assuming timestamp1 and timestamp2 are in milliseconds
export const daysBetween = (timestamp1: number, timestamp2: number): number => {
  // Convert timestamps to Date objects
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  
   // Calculate the difference in milliseconds
   const differenceMs: number = Math.abs(date1.getTime() - date2.getTime());
    
   // Convert milliseconds to days
   const days: number = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  
  return days;
}
