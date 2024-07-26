import { WsResponse } from '@nestjs/websockets';

export enum RealTimeEventName {
  UNKNOWN = 'UNKNOWN',
  ON_CONNECT = 'ON_CONNECT',
  ON_DISCONNECT = 'ON_DISCONNECT',
  AUTHORIZE_REQUEST_TO_SERVER = 'AUTHORIZE_REQUEST_TO_SERVER',
  AUTHORIZE_RESPONSE_FROM_SERVER = 'AUTHORIZE_RESPONSE_FROM_SERVER',
}

export class WsResponseImpl<T> implements WsResponse<T> {
  event: RealTimeEventName;
  data: T;

  public static of<T>(event: RealTimeEventName, data: T): WsResponse<T> {
    const res = new WsResponseImpl<T>();
    res.event = event;
    res.data = data;

    return res;
  }
}
