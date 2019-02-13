import Client, { ClientOptions } from './Client';
import ClientManager from './ClientManager';
import SubscriptionHandle from './SubscriptionHandle';

export { default as Collection } from './Collection';

export function createClient(options: ClientOptions): Client {
  return ClientManager.createClient(options);
}

export function track(
  fn: (subscribe: (publication: string, ...params: any[]) => SubscriptionHandle) => any,
  clientName?: string
): () => void {
  const client = ClientManager.getClient(clientName || 'default');
  if (!client) {
    throw new Error('Client not found');
  }
  return client.track(fn);
}

export function getClient(name?: string) {
  return ClientManager.getClient(name || 'default');
}

if (window) {
  // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // const { host } = window.location;
  const protocol = 'ws:';
  const host = '127.0.0.1:4000';
  createClient({
    name: 'default',
    endpoint: `${protocol}//${host}/websocket`
  });
}
