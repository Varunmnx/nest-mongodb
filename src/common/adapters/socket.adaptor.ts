import { Server, Socket } from 'socket.io';
import { UniqueScoketIdGenetrator } from '../utils/unique-scoket-id.generator';

const IS_AUTHORIZED = 'IS_AUTHORIZED';

const SOCKET_USER_ID = 'SOCKET_USER_ID';

const UNIQUE_SOCKET_CONNECTION_BACKEND_ID = 'UNIQUE_SOCKET_CONNECTION_BACKEND_ID';

export interface SocketConnectionValues {
  userId: string | string;
  clientConnectionId: string;
  backendConnectionId: string;
  connectionSubscriberId: string;
  isWebActive?: boolean;
}

export class SocketConnectionAdaptor {
  public static readonly DEFAULT_CLIENT_EVENT = '__DEFAULT_EVENT__';

  public static __sharedServer: Server;
  public get sharedServer(): Server {
    return SocketConnectionAdaptor.__sharedServer;
  }

  public static setSharedServer(server: Server) {
    this.__sharedServer = server;
  }

  private constructor(
    private readonly server: Server,
    private readonly client: Socket,
  ) {
    if (client && !client[UNIQUE_SOCKET_CONNECTION_BACKEND_ID]) {
      client[UNIQUE_SOCKET_CONNECTION_BACKEND_ID] = UniqueScoketIdGenetrator.gernerate();
    }
  }

  public static of(
    server: Server = SocketConnectionAdaptor.__sharedServer,
    client: Socket = null,
  ): SocketConnectionAdaptor {
    return new SocketConnectionAdaptor(server, client);
  }

  public setAuthorized(isAuthorized: boolean) {
    if (!this.client) return;
    this.client[IS_AUTHORIZED] = isAuthorized;
  }

  public isAuthorized(): boolean {
    if (!this.client) return false;

    try {
      return this.client[IS_AUTHORIZED];
    } catch (error) {
      return false;
    }
  }

  public sendEventToClient(event: string | string, args: any, recipient?: string | string[]): boolean {
    if (!args) {
      args = { UNKNOWN: 'UNKNOWN' };
    }

    if (event == null || event == SocketConnectionAdaptor.DEFAULT_CLIENT_EVENT || event.trim().length < 1) {
      event = this.defaultEventSubscriberId;
    }

    if (!event || event.trim().length < 1) {
      return false;
    }

    try {
      if (this.client) {
        // console.log('sendEventToClient', this.clientConnectionId, event, args);
        if (recipient && typeof recipient === 'string') {
          this.client.to(recipient);
        } else if (typeof recipient === 'object') {
          this.client.to(recipient);
        }
        this.client.emit(event + '', args);
        return true;
      } else if (this.server) {
        this.sendEventToServer(event + '', args, recipient);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  public sendEventToServer(event: string | string, args: any, recipient?: string | string[]): boolean {
    if (!args) {
      args = {
        UNKNOWN: 'UNKNOWN',
      };
    }

    if (!event || event.trim().length < 1) {
      return false;
    }

    try {
      if (this.server) {
        let reciever = [];
        if (recipient && typeof recipient === 'string') {
          // this.server.to(recipient)
          reciever = [recipient];
        } else if (typeof recipient === 'object') {
          reciever = recipient;
        }
        // console.log('sendEventToServer', this.clientConnectionId, event, args);
        this.server.to(reciever).emit(event + '', args);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  public sendEventsToServer(events: string[] | string[], args: any): boolean {
    if (!events) return false;
    if (!this.server) return false;
    // if(recipients&&recipients.length!==0&&typeof recipients==="object"){
    //      recipients.map(recipient=>this.server.to(recipient))
    // }
    events.forEach((event) => {
      try {
        this.sendEventToServer(event, args, event);
      } catch (error) {}
    });

    return true;
  }

  public refreshBackendConnectionId() {
    if (!this.client) return;
    this.client[UNIQUE_SOCKET_CONNECTION_BACKEND_ID] = UniqueScoketIdGenetrator.gernerate();
  }

  public set userId(value: string | string) {
    if (!this.client) return;

    this.client[SOCKET_USER_ID] = value;
  }

  public get userId() {
    if (!this.client) return '';
    return this.client[SOCKET_USER_ID];
  }

  public get clientConnectionId() {
    if (!this.client) return '';
    return this.client.id;
  }

  private get defaultEventSubscriberId() {
    if (!this.client) return '';
    return '__' + this.client.id + '__';
  }

  public get backendConnectionId() {
    if (!this.client) return '';
    return this.client[UNIQUE_SOCKET_CONNECTION_BACKEND_ID];
  }
}
