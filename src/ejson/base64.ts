/* tslint:disable:no-bitwise */

// Base 64 encoding

const BASE_64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE_64_VALS = Object.create(null);

const getChar = (val: number) => BASE_64_CHARS.charAt(val);
const getVal = (ch: string) => (ch === '=' ? -1 : BASE_64_VALS[ch]);

for (let i = 0; i < BASE_64_CHARS.length; i++) {
  BASE_64_VALS[getChar(i)] = i;
}

const encode = (array: any) => {
  if (typeof array === 'string') {
    const str = array;
    array = newBinary(str.length);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      if (ch > 0xff) {
        throw new Error('Not ascii. Base64.encode can only take ascii strings.');
      }

      array[i] = ch;
    }
  }

  const answer: any = [];
  let a: any = null;
  let b: any = null;
  let c: any = null;
  let d: any = null;

  array.forEach((elm: any, i: number) => {
    switch (i % 3) {
      case 0:
        a = (elm >> 2) & 0x3f;
        b = (elm & 0x03) << 4;
        break;
      case 1:
        b = b | ((elm >> 4) & 0xf);
        c = (elm & 0xf) << 2;
        break;
      case 2:
        c = c | ((elm >> 6) & 0x03);
        d = elm & 0x3f;
        answer.push(getChar(a));
        answer.push(getChar(b));
        answer.push(getChar(c));
        answer.push(getChar(d));
        a = null;
        b = null;
        c = null;
        d = null;
        break;
    }
  });

  if (a != null) {
    answer.push(getChar(a));
    answer.push(getChar(b));
    if (c == null) {
      answer.push('=');
    } else {
      answer.push(getChar(c));
    }

    if (d == null) {
      answer.push('=');
    }
  }

  return answer.join('');
};

// XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.
const newBinary = (len: number) => {
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
    const ret: any = [];
    for (let i = 0; i < len; i++) {
      ret.push(0);
    }

    ret.$Uint8ArrayPolyfill = true;
    return ret;
  }
  return new Uint8Array(new ArrayBuffer(len));
};

const decode = (str: string) => {
  let len = Math.floor((str.length * 3) / 4);
  if (str.charAt(str.length - 1) === '=') {
    len--;
    if (str.charAt(str.length - 2) === '=') {
      len--;
    }
  }

  const arr = newBinary(len);

  let one: any = null;
  let two: any = null;
  let three: any = null;

  let j = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    const v = getVal(c);
    switch (i % 4) {
      case 0:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = v << 2;
        break;
      case 1:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = one | (v >> 4);
        arr[j++] = one;
        two = (v & 0x0f) << 4;
        break;
      case 2:
        if (v >= 0) {
          two = two | (v >> 2);
          arr[j++] = two;
          three = (v & 0x03) << 6;
        }

        break;
      case 3:
        if (v >= 0) {
          arr[j++] = three | v;
        }

        break;
    }
  }

  return arr;
};

export const Base64 = { encode, decode, newBinary };
