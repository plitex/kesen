import Client, { ClientOptions } from './Client';
import ClientManager from './ClientManager';
import SubscriptionHandle from './SubscriptionHandle';

function getDefaultClient(): Client {
  const client = ClientManager.getClient('default');
  if (!client) {
    throw new Error(
      "Default client not found, you can create it with createClient('default', ...)"
    );
  }
  return client;
}

export { default as Collection } from './Collection';

export function createClient(name: string, url: string, options?: ClientOptions) {
  return new Client(name, url, options);
}

export function getClient(name?: string) {
  return ClientManager.getClient(name || 'default');
}

export default {
  connect: () => {
    const client = getDefaultClient();
    return client.connect();
  },
  disconnect: () => {
    const client = getDefaultClient();
    return client.disconnect();
  },
  isConnected: () => {
    const client = getDefaultClient();
    return client.isConnected();
  },
  call: <T>(method: string, ...params: any[]): Promise<T> => {
    const client = getDefaultClient();
    return client.call(method, ...params);
  },
  subscribe: (publication: string, ...params: any[]): SubscriptionHandle => {
    const client = getDefaultClient();
    return client.subscribe(publication, ...params);
  },
  unsubscribe: (handle: SubscriptionHandle) => {
    const client = getDefaultClient();
    return client.unsubscribe(handle);
  },
  track: (
    fn: (subscribe: (publication: string, ...params: any[]) => SubscriptionHandle) => any
  ): (() => void) => {
    const client = getDefaultClient();
    return client.track(fn);
  },
  login: (loginParameters: any) => {
    const client = getDefaultClient();
    return client.login(loginParameters);
  },
  logout: () => {
    const client = getDefaultClient();
    return client.logout();
  },
  getUserId: () => {
    const client = getDefaultClient();
    return client.getUserId();
  }
};

// Create default client if we are in a browser and it's not created yet,
// this is by convention the default way to connect to a Meteor app

if (window && !getClient()) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const { host } = window.location;

  createClient('default', `${protocol}//${host}/websocket`);
}
