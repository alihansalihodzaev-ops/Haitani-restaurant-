export type CartLine = { id:string; name:string; price:number; quantity:number; description?:string; ingredients?:string[]; custom?:boolean };
export const money = (value:number) => new Intl.NumberFormat('ru-KZ',{style:'currency',currency:'KZT',maximumFractionDigits:0}).format(value).replace('KZT','₸');
