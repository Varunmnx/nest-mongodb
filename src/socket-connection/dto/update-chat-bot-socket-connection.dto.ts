import { PartialType } from '@nestjs/mapped-types';
import { CreateSocketConnectionDto } from './create-chat-bot-socket-connection.dto';

export class UpdateSocketConnectionDto extends PartialType(CreateSocketConnectionDto) {
  id: number;
}
