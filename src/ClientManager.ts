import KesenClient from './Client';

class ClientManager {
  private clients: Map<string, KesenClient> = new Map<string, KesenClient>();

  public registerClient(client: KesenClient) {
    if (!client) {
      throw Error('Client required');
    }

    if (this.clients.get(client.name)) {
      throw new Error(`Client '${client.name}' client already exists`);
    }
    this.clients.set(client.name, client);
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
