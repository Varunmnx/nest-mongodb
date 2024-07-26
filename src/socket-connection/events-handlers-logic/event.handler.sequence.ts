import { SocketConnectionAdaptor } from '@/common/adapters/socket.adaptor';
import { Sequence } from '../../common/sequence';

export class EventHandlerSequence<T> extends Sequence<T, SocketConnectionAdaptor> {
  public async execute(context: T, socketAdaptor: SocketConnectionAdaptor): Promise<void> {
    return await super.execute(context, socketAdaptor);
  }
}
