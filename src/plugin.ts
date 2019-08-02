import { Plugin } from '@nelts/factory';
import AgentFactory from './index';
import {  MessageSendOptions} from '@nelts/messager';

export default class AgentPlugin extends Plugin<AgentFactory> {
  constructor(app: AgentFactory, name: string, cwd: string) {
    super(app, name, cwd);
  }

  get messager() {
    return this.app.messager;
  }

  send(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.send(method, data, options);
  }

  asyncSend(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.asyncSend(method, data, options);
  }

  asyncHealth() {
    return this.messager.asyncHealth();
  }

  kill() {
    return this.app.kill(process.pid);
  }

  notice(type: string, data: any) {
    this.send('notice', { type, data });
  }
}