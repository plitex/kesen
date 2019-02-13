import createDebug from 'debug';
import EventEmitter from 'eventemitter3';
import { observable } from 'mobx';

const debug = createDebug('kesen:socket');

interface SocketInterface {
  onclose: ((...params: any[]) => any) | null;
  onerror: ((...params: any[]) => any) | null;
  onmessage: ((...params: any[]) => any) | null;
  onopen: ((...params: any[]) => any) | null;
  close(code?: number, reason?: string): void;
  send(data: string): void;
}

export type SocketConstructorType = new (endpoint: string, ...args: any[]) => SocketInterface;

export default class Socket extends EventEmitter {
  private SocketConstructor: SocketConstructorType;
  private endpoint: string;
  private socket: SocketInterface | null;

  @observable
  private connected: boolean;

  constructor(SocketConstructor: SocketConstructorType, endpoint: string) {
    super();

    this.SocketConstructor = SocketConstructor;
    this.endpoint = endpoint;
    this.socket = null;
    this.connected = false;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public send(message: any) {
    if (!this.socket) {
      return;
    }
    this.socket.send(message);
    debug('sent:', message);
  }

  public open() {
    if (this.socket) {
      return;
    }
    this.socket = new this.SocketConstructor(this.endpoint);
    this.socket.onopen = () => {
      debug('open');
      this.connected = true;
      this.emit('open');
    };
    this.socket.onclose = () => {
      debug('close');
      this.socket = null;
      this.connected = false;
      this.emit('close');
    };
    this.socket.onerror = () => {
      debug('error');
      if (this.socket) {
        delete this.socket.onclose;
        this.socket.close();
        this.socket = null;
      }

      this.connected = false;
      this.emit('close');
    };
    this.socket.onmessage = message => {
      debug('received:', message.data);
      this.emit('message', message.data);
    };
  }

  public close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
