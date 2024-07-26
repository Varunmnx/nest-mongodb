import { EventHandlerSequence } from './event.handler.sequence';

export class AutoDisconnectEventContext {
  public sender: string;
  public reciver: string;

  constructor() {}
}

export class AutoDisconnectEventSequence extends EventHandlerSequence<AutoDisconnectEventContext> {}
