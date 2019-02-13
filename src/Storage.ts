interface StorageInterface {
  [key: string]: string;
}

export default class Storage {
  private storage: StorageInterface;

  constructor() {
    if (window && window.localStorage !== undefined) {
      this.storage = window.localStorage;
    } else {
      this.storage = {};
    }
  }

  public get(key: string) {
    return this.storage[key];
  }

  public set(key: string, value: any) {
    this.storage[key] = value;
  }

  public del(key: string) {
    delete this.storage[key];
  }
}
