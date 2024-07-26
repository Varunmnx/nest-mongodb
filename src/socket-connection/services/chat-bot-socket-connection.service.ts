import { Injectable } from '@nestjs/common';
import { CreateSocketConnectionDto } from '../dto/create-chat-bot-socket-connection.dto';
import { UpdateSocketConnectionDto } from '../dto/update-chat-bot-socket-connection.dto';
import { SocketConnectionAdaptor } from '@/common/adapters/socket.adaptor';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';

@Injectable()
export class ChatBotSocketConnectionService implements OnGatewayConnection, OnGatewayDisconnect {
  // constructor(private userRepository: UserRepository) {}
  async handleConnection(socketAdaptor: SocketConnectionAdaptor): Promise<void> {
    socketAdaptor.refreshBackendConnectionId();

    console.log(this, 'handleConnection', { clientConnectionId: socketAdaptor.clientConnectionId });
  }

  async handleDisconnect(socketAdaptor: SocketConnectionAdaptor): Promise<void> {
    console.log(this, 'handleDisconnect', { clientConnectionId: socketAdaptor.clientConnectionId });
  }

  create(createSocketConnectionDto: CreateSocketConnectionDto) {
    return 'This action adds a new socketConnection';
  }

  findAll() {
    return `This action returns all socketConnection`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socketConnection`;
  }

  update(id: number, updateSocketConnectionDto: UpdateSocketConnectionDto) {
    return `This action updates a #${id} socketConnection`;
  }

  remove(id: number) {
    return `This action removes a #${id} socketConnection`;
  }
}
