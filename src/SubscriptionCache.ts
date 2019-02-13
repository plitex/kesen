import SubscriptionHandle from './SubscriptionHandle';

interface SubscriptionHandleMap {
  [key: string]: SubscriptionHandle;
}

export default class SubscriptionCache {
  private byId: SubscriptionHandleMap;
  private byFingerprint: SubscriptionHandleMap;

  constructor() {
    this.byId = {};
    this.byFingerprint = {};
  }

  public add(sub: SubscriptionHandle) {
    this.byId[sub.id] = sub;
    this.byFingerprint[sub.fingerprint] = sub;
  }

  public get(idOrFingerprint: string) {
    return this.byId[idOrFingerprint] || this.byFingerprint[idOrFingerprint] || null;
  }

  public del(idOrFingerprint: string) {
    const sub = this.get(idOrFingerprint) || {};
    delete this.byId[sub.id];
    delete this.byFingerprint[sub.fingerprint];
  }

  public clear() {
    this.byId = {};
    this.byFingerprint = {};
  }

  public forEach(callbackfn: (value: SubscriptionHandle, index: number, array: any[]) => void) {
    Object.keys(this.byId).forEach((id, index, array) => {
      callbackfn(this.byId[id], index, array);
    });
  }

  public size() {
    return Object.keys(this.byId).length;
  }
}
