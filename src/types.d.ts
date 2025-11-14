declare module '*' {
  const value: any;
  export default value;
}

declare global {
  interface Array<T> {
    map(callbackfn: (value: any, index: any, array: any[]) => any, thisArg?: any): any[];
  }
}

export {}; 