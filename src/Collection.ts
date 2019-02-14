import mingo from 'mingo';
import { observable } from 'mobx';
import ClientManager from './ClientManager';

export default class Collection<T> {
  public readonly name: string;

  private documents: any;

  constructor(name: string, clientName: string = 'default') {
    if (!name || name.trim() === '') {
      throw new Error('Name required');
    }

    this.name = name;
    this.documents = observable({});
    const client = ClientManager.getClient(clientName);
    if (!client) {
      throw new Error(`Kesen client '${clientName}' not found`);
    }
    client.registerCollection(this);
  }

  public insert(id: string, fields: any) {
    this.documents[id] = { _id: id, ...fields };
  }

  public update(id: string, fields: any, cleared: string[] = []) {
    const doc = this.documents[id];
    if (!doc) {
      throw new Error('Document not found');
    }
    const newDoc = {
      ...doc,
      ...fields
    };
    cleared.forEach(c => delete newDoc[c]);
    this.documents[id] = newDoc;
  }

  public remove(id: string) {
    delete this.documents[id];
  }

  public count() {
    return Object.keys(this.documents).length;
  }

  public find(idOrSelector?: any): mingo.Cursor<T> {
    const selector = typeof idOrSelector === 'string' ? { _id: idOrSelector } : idOrSelector;
    return mingo.find(Object.values(this.documents), selector);
  }

  public findOne(idOrSelector?: any): T | undefined | null {
    return this.find(idOrSelector).next();
  }
}
