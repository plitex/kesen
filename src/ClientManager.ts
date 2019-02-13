import createDebug from 'debug';
import KesenClient, { ClientOptions } from './Client';

const debug = createDebug('kesen:client-manager');

class ClientManager {
  private clients: Map<string, KesenClient> = new Map<string, KesenClient>();

  public createClient(options: ClientOptions) {
    const name = options.name || 'default';

    debug(`Creating client ${name}`);

    if (this.clients.get(name)) {
      throw new Error(`You must set a different client name, ${name} client already exists`);
    }
    const client = new KesenClient(options);
    this.clients.set(name, client);
    return client;
  }

  public getClient(name: string) {
    return this.clients.get(name);
  }

  public getClients() {
    return this.clients.values();
  }
}

export default new ClientManager();
