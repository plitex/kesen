import createDebug from 'debug';
import { EventEmitter } from 'eventemitter3';
import { observable } from 'mobx';
import { EJSON } from './ejson';
import Socket, { SocketConstructorType } from './Socket';

const debug = createDebug('kesen:connection');

const DDP_VERSION = '1';
const DEFAULT_RECONNECT_INTERVAL = 10000;

export interface Options {
  endpoint: string;
  SocketConstructor: SocketConstructorType;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export default class DDPConnection extends EventEmitter {
  private socket: Socket;
  private messageQueue: any[];
  private autoConnect: boolean;
  private autoReconnect: boolean;
  private reconnectInterval: number;

  @observable
  private status: string;

  private nextMethodId: number = 0;

  constructor(options: Options) {
    super();

    this.status = 'disconnected';
    this.autoConnect = options.autoConnect !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;
    this.messageQueue = [];
    this.socket = new Socket(options.SocketConstructor, options.endpoint);

    this.socket.on('open', () => {
      this.socket.send(
        EJSON.stringify({
          msg: 'connect',
          support: [DDP_VERSION],
          version: DDP_VERSION
        })
      );
    });

    this.socket.on('close', () => {
      this.status = 'disconnected';
      this.messageQueue = [];
      this.emit('disconnected');
      if (this.autoReconnect) {
        // Schedule a reconnection
        setTimeout(this.socket.open.bind(this.socket), this.reconnectInterval);
      }
    });

    this.socket.on('message', message => {
      debug('received:', message);
      let messageObj;
      try {
        messageObj = EJSON.parse(message);
      } catch (ignore) {
        debug('Error:', ignore);
        this.socket.close();
        return;
      }

      if (messageObj.msg === 'connected') {
        this.status = 'connected';
        this.emit('connected');
        this.sendMessageQueue();
      } else if (messageObj.msg === 'ping') {
        this.sendMessage({ msg: 'pong', id: messageObj.id });
      } else {
        this.emit(messageObj.msg, messageObj);
      }
    });

    if (this.autoConnect) {
      this.connect();
    }
  }

  public connect() {
    this.socket.open();
  }

  public disconnect() {
    this.autoReconnect = false;
    this.socket.close();
  }

  public isConnected() {
    return this.status === 'connected';
  }

  public method(name: string, params: any[]) {
    const id = this.getMethodId();
    this.sendMessage({
      msg: 'method',
      id,
      method: name,
      params
    });
    return id;
  }

  public sub(name: string, params: any[], id: string | null = null) {
    id = id || this.getMethodId();
    this.sendMessage({
      msg: 'sub',
      id,
      name,
      params
    });
    return id;
  }

  public unsub(id: string) {
    this.sendMessage({
      msg: 'unsub',
      id
    });
    return id;
  }

  private sendMessage(obj: object) {
    if (this.isConnected()) {
      const message = EJSON.stringify(obj);
      this.socket.send(message);
      return true;
    } else {
      this.messageQueue.push(obj);
      return false;
    }
  }

  private sendMessageQueue() {
    this.messageQueue.forEach(m => {
      if (!this.sendMessage(m)) {
        return;
      }
    });
  }

  private getMethodId(): string {
    const id = this.nextMethodId;
    this.nextMethodId += 1;
    return String(id);
  }
}
