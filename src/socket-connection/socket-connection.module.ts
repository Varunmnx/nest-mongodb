import { Module } from '@nestjs/common';
import { ChatBotSocketConnectionService } from './services/chat-bot-socket-connection.service';
import { ChatBotSocketConnectionGateway } from './gateways/chat-bot-socket-connection.gateway'; 
import { JwtService } from '@nestjs/jwt'; 
import { LoggerService } from '@/common/logger/logger.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose'; 

@Module({
  imports: [HttpModule, MongooseModule.forFeature([ ])],
  providers: [
    // AuthService,
    JwtService,
    // UserRepository,
    // UserProfileRepository,
    // RefreshTokenRepository,
    // WaitingListRepository,
    LoggerService,
    // ChatBotService,
    // ChatBotRepository,
    // ChatBotHistoryService,
    // ChatBotHistoryRepository,
    // ConnectedAccountsRepository,
    // ApiKeyRepository,
    ChatBotSocketConnectionGateway,
    ChatBotSocketConnectionService,
  ],
})
export class SocketConnectionModule {}
