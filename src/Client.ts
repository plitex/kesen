import createDebug from 'debug';
import EventEmitter from 'eventemitter3';
import { autorun } from 'mobx';
import uuidv1 from 'uuid/v1';
import Collection from './Collection';
import DDPConnection from './DDPConnection';
import { MethodHandle, MethodHandleMap } from './MethodHandle';
import { SocketConstructorType } from './Socket';
import Storage from './Storage';
import SubscriptionCache from './SubscriptionCache';
import SubscriptionHandle from './SubscriptionHandle';

// const debug = createDebug('kesen');
const debugSub = createDebug('kesen:subscriptions');
const debugTracker = createDebug('kesen:tracker');

function createFingerprint(publication: string, params: any[]) {
  return JSON.stringify({ publication, params });
}

export interface ClientOptions {
  name: string;
  endpoint: string;
  SocketConstructor?: SocketConstructorType;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export default class Client extends EventEmitter {
  public readonly name: string;

  private storage: Storage;
  private ddpConnection: DDPConnection;
  private collections: Map<string, Collection> = new Map<string, Collection>();
  private methodHandles: MethodHandleMap = {};
  private subscriptionCache: SubscriptionCache = new SubscriptionCache();
  private userId: string | null = null;

  constructor(options: ClientOptions) {
    super();

    this.name = options.name;
    this.storage = new Storage();
    this.userId = null;

    this.ddpConnection = new DDPConnection({
      endpoint: options.endpoint,
      SocketConstructor: options.SocketConstructor || WebSocket,
      autoConnect: options.autoConnect,
      autoReconnect: options.autoReconnect,
      reconnectInterval: options.reconnectInterval
    });

    this.ddpConnection.on('connected', this.handleConnected.bind(this));
    this.ddpConnection.on('disconnected', this.handleDisconnected.bind(this));
    this.ddpConnection.on('result', this.handleResult.bind(this));
    this.ddpConnection.on('ready', this.handleReady.bind(this));
    this.ddpConnection.on('nosub', this.handleNoSub.bind(this));
    this.ddpConnection.on('added', this.handleAdded.bind(this));
    this.ddpConnection.on('changed', this.handleChanged.bind(this));
    this.ddpConnection.on('removed', this.handleRemoved.bind(this));
  }

  public connect(): void {
    this.ddpConnection.connect();
  }

  public disconnect() {
    this.ddpConnection.disconnect();
  }

  public isConnected() {
    return this.ddpConnection.isConnected();
  }

  public getUserId() {
    return this.userId;
  }

  public call<T>(method: string, ...params: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = this.ddpConnection.method(method, params);
      const handle: MethodHandle<T> = {
        id,
        resolve,
        reject
      };
      this.methodHandles[handle.id] = handle;
    });
  }

  public unsubscribe(handle: SubscriptionHandle) {
    debugSub(`Unsubscribe from '${handle.publication}' (ID=${handle.id})`);
    this.ddpConnection.unsub(handle.id);
  }

  public login(loginParameters: any) {
    return this.call<any>('login', loginParameters).then(value =>
      this.handleLogin(value.id, value.token)
    );
  }

  public logout() {
    return this.call('logout').then(() => this.handleLogout());
  }

  public subscribe(publication: string, ...params: any[]): SubscriptionHandle {
    const fingerprint = createFingerprint(publication, params);
    let sub = this.subscriptionCache.get(fingerprint);
    if (!sub) {
      // If there is no cached subscription, subscribe
      debugSub(`Subscribe to ${publication}`);
      const id = this.ddpConnection.sub(publication, params);
      debugSub(`'${publication}' subcription sent (ID=${id})`);
      const queued = !this.ddpConnection.isConnected();
      sub = new SubscriptionHandle(this, publication, params, fingerprint, id);
      sub.queued = queued;
      this.subscriptionCache.add(sub);
    } else {
      debugSub(`Cached subscription '${publication}' found (ID=${sub.id})`);
    }
    // Return the subscription object
    return sub;
  }

  public track(
    fn: (subscribe: (publication: string, ...params: any[]) => SubscriptionHandle) => any
  ): () => void {
    const trackerId = uuidv1();
    let oldCache = new SubscriptionCache();
    let cache = new SubscriptionCache();

    const autorunDisposer = autorun(() => {
      debugTracker(`Tracker reaction start (ID=${trackerId})`);

      // Store current cache to detect unused subscriptions after execution
      oldCache = cache;
      cache = new SubscriptionCache();
      const subscribeFn = (publication: string, ...params: any[]) => {
        const sub = this.subscribe(publication, ...params);
        cache.add(sub);
        oldCache.del(sub.fingerprint);
        return sub;
      };

      // Execute callback function
      fn(subscribeFn);

      // Unsubscribe from unused subscriptions
      const count = oldCache.size();
      if (count > 0) {
        debugSub(`Unsubscribing from ${count} subscription${count > 1 ? 's' : ''}`);
        oldCache.forEach(sub => sub.unsubscribe());
      }
      debugTracker(`Tracker reaction end (ID=${trackerId})`);
    });

    return () => {
      debugTracker(`Tracker dispose start (ID=${trackerId})`);
      autorunDisposer();
      cache.forEach(sub => sub.unsubscribe());
      oldCache.clear();
      cache.clear();
      debugTracker(`Tracker dispose end (ID=${trackerId})`);
    };
  }

  public registerCollection(collection: Collection) {
    if (this.collections.get(collection.name)) {
      throw new Error(`A collection '${collection.name}' already exists`);
    }

    this.collections.set(collection.name, collection);
  }

  private handleConnected() {
    this.resumeLogin();
    this.emit('connected');
  }

  private handleDisconnected() {
    this.emit('disconnected');
  }

  private handleResult({ id, error, result }: any) {
    const handle = this.methodHandles[id];
    if (error) {
      handle.reject(error);
    } else {
      handle.resolve(result);
    }
    delete this.methodHandles[id];
  }

  private handleReady({ subs }: any) {
    subs.forEach((id: string) => {
      const handle = this.subscriptionCache.get(id);
      if (handle) {
        handle.ready = true;
        handle.emit('ready');
      }
    });
  }

  private handleNoSub({ id, error }: any) {
    if (error) {
      const handle = this.subscriptionCache.get(id);
      if (handle) {
        handle.ready = true;
        handle.emit('error', error);
      }
    }
    this.subscriptionCache.del(id);
  }

  private handleAdded({ collection, id, fields }: any) {
    const c = this.find(collection);
    if (c) {
      c.insert(id, fields);
    }
    this.emit('documentAdded', { collection, id, fields });
  }

  private handleChanged({ collection, id, fields, cleared }: any) {
    const c = this.find(collection);
    if (c) {
      c.update(id, fields, cleared);
    }
    this.emit('documentChanged', { collection, id, fields, cleared });
  }

  private handleRemoved({ collection, id }: any) {
    const c = this.find(collection);
    if (c) {
      c.remove(id);
    }
    this.emit('documentRemoved', { collection, id });
  }

  private handleLogin(id: string, token: string) {
    const loggedIn = !this.userId;
    this.userId = id;
    this.storage.set('userId', id);
    this.storage.set('loginToken', token);
    if (loggedIn) {
      this.emit('loggedIn', id);
    }
  }

  private handleLogout() {
    const loggedOut = !!this.userId;
    this.userId = null;
    this.storage.del('userId');
    this.storage.del('loginToken');
    if (loggedOut) {
      this.emit('loggedOut');
    }
  }

  private resumeLogin() {
    const token = this.storage.get('loginToken');
    if (token) {
      this.login({ resume: token })
        .then(() => {
          this.restartSubscriptions();
        })
        .catch(() => {
          this.handleLogout();
        });
    } else {
      this.restartSubscriptions();
    }
  }

  private restartSubscriptions() {
    const count = this.subscriptionCache.size();
    if (count > 0) {
      debugSub(`Restarting ${count} subscription${count > 1 ? 's' : ''}`);
      this.subscriptionCache.forEach(sub => this.restartSubscription(sub));
    }
  }

  private restartSubscription(sub: SubscriptionHandle) {
    if (!sub.queued) {
      const queued = !this.ddpConnection.isConnected();
      this.ddpConnection.sub(sub.publication, sub.params, sub.id);
      sub.queued = queued;
      debugSub(`Subscription '${sub.publication}' (ID=${sub.id}) restarted`);
    } else {
      sub.queued = false;
      debugSub(`Subscription '${sub.publication}' (ID=${sub.id}) was in queue`);
    }
  }

  private find(collection: string) {
    return this.collections.get(collection);
  }
}
