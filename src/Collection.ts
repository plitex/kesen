import mingo from 'mingo';
import { observable, toJS } from 'mobx';
import ClientManager from './ClientManager';

export default class Collection {
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

  public add(id: string, fields: any) {
    this.documents[id] = { _id: id, ...fields };
  }

  public change(id: string, fields: any, cleared: string[] = []) {
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

  public find(idOrSelector?: any) {
    if (!idOrSelector) {
      const result = [];
      for (const key of Object.keys(this.documents)) {
        result.push(toJS(this.documents[key]));
      }
      return result;
    } else if (typeof idOrSelector === 'string') {
      const doc = this.documents[idOrSelector];
      return doc ? [toJS(doc)] : [];
    } else {
      const r = mingo.find(Object.values(this.documents), idOrSelector).all();
      return r.map(o => toJS(o));
    }
  }

  public findOne(idOrSelector?: any) {
    const result = this.find(idOrSelector);
    return result.length > 0 ? result[0] : undefined;
  }
}
