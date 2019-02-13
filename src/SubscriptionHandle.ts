import { EventEmitter } from 'eventemitter3';
import { observable } from 'mobx';
import Client from './Client';

export default class SubscriptionHandle extends EventEmitter {
  public readonly id: string;
  public readonly publication: string;
  public readonly params: any[];
  public readonly fingerprint: string;
  public readonly trackerId?: string;

  @observable
  public ready = false;
  public queued = false;

  private readonly client: Client;

  constructor(
    client: Client,
    publication: string,
    params: any[],
    fingerprint: string,
    id: string,
    trackerId?: string
  ) {
    super();
    this.client = client;
    this.publication = publication;
    this.params = params;
    this.fingerprint = fingerprint;
    this.id = id;
    this.trackerId = trackerId;
  }

  public unsubscribe() {
    this.client.unsubscribe(this);
  }

  public onReady(cb: () => void) {
    this.on('ready', cb);
  }
}
