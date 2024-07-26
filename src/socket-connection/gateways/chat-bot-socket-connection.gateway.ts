/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WsResponse,
} from '@nestjs/websockets';
import { ChatBotSocketConnectionService } from '../services/chat-bot-socket-connection.service';
import { CreateSocketConnectionDto } from '../dto/create-chat-bot-socket-connection.dto';
import { UpdateSocketConnectionDto } from '../dto/update-chat-bot-socket-connection.dto';
import { Server, Socket } from 'socket.io';
import { SocketConnectionAdaptor } from '@/common/adapters/socket.adaptor';
import { RealTimeEventName, WsResponseImpl } from '@/common/socket';
import { Config } from '@/microserviceFactory.factory';

@WebSocketGateway({ namespace: '/api/realagentai/chat-bot', cors: true })
export class ChatBotSocketConnectionGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly socketConnectionService: ChatBotSocketConnectionService) {}

  async onModuleInit() {
    SocketConnectionAdaptor.setSharedServer(this.server);
  }

  async handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) {
    this.socketConnectionService.handleConnection(SocketConnectionAdaptor.of(this.server, client));
    return WsResponseImpl.of(RealTimeEventName.ON_CONNECT, {});
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.socketConnectionService.handleDisconnect(SocketConnectionAdaptor.of(this.server, client));
    return WsResponseImpl.of(RealTimeEventName.ON_DISCONNECT, {});
  }

  @SubscribeMessage('createSocketConnection')
  create(@MessageBody() createSocketConnectionDto: CreateSocketConnectionDto) {
    return this.socketConnectionService.create(createSocketConnectionDto);
  }

  @SubscribeMessage('findAllSocketConnection')
  findAll() {
    return this.socketConnectionService.findAll();
  }

  @SubscribeMessage('findOneSocketConnection')
  findOne(@MessageBody() id: number) {
    return this.socketConnectionService.findOne(id);
  }

  @SubscribeMessage('updateSocketConnection')
  update(@MessageBody() updateSocketConnectionDto: UpdateSocketConnectionDto) {
    return this.socketConnectionService.update(updateSocketConnectionDto.id, updateSocketConnectionDto);
  }

  @SubscribeMessage('removeSocketConnection')
  remove(@MessageBody() id: number) {
    return this.socketConnectionService.remove(id);
  }
}
