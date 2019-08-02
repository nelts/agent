import AgentFactory from '../index';
import { MessageSendOptions } from '@nelts/messager';
export default class AgentComponent {
  private _app: AgentFactory;
  constructor(app: AgentFactory) {
    this._app = app;
  }

  get logger() {
    return this._app.logger;
  }

  get messager() {
    return this._app.messager;
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
    return this._app.kill(process.pid);
  }

  notice(type: string, data: any) {
    this.send('notice', { type, data });
  }
}

export declare class AgentComponentImplements extends AgentComponent {
  constructor(app: AgentFactory);
  beforeCreate?(): Promise<void>;
  created?(): Promise<void>;
  beforeDestroy?(): Promise<void>;
  destroyed?(): Promise<void>;
  catchError?(err: Error): Promise<void>;
  ready?(socket?:any): Promise<void>;
  health?<T = any>(socket: any): Promise<T>;
  [name: string]: any;
}