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