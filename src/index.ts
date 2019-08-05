import 'reflect-metadata';
import { WidgetComponent, Processer } from '@nelts/process';
import { Factory, InCommingMessage } from '@nelts/factory';
import { RequireDefault } from '@nelts/utils';
import { CronJob } from 'cron';
import { Agent as AgentMessager, MessageReceiveDataOptions } from '@nelts/messager';
import AgentPlugin from './plugin';
import AgentComponent, { AgentComponentImplements } from './components/base';
import DecoratorNameSpace from './decorators/namespace';
import { ScheduleDecoratorType } from './decorators/schedule';
import { runFunctionalWithPromise } from '@nelts/utils';
import AgentBootstrapCompiler from './compilers/bootstrap';

import Ipc from './decorators/ipc';
import Auto from './decorators/auto';
import Namespace from './decorators/namespace';
import Schedule from './decorators/schedule';

type AgentComponentConstructorType = { new(app: AgentFactory): AgentComponentImplements };
type IPC_POOL = {
  [name: string]: boolean;
}

export default class AgentFactory extends Factory<AgentPlugin> implements WidgetComponent {
  private _name: string;
  private _agentComponentConstructor: AgentComponentConstructorType;
  private _target: AgentComponentImplements;
  private _messager: AgentMessager<this>;
  private _ipc_pool: IPC_POOL = {};
  constructor(processer: Processer, args: InCommingMessage) {
    super(processer, args, AgentPlugin);
    const target = RequireDefault<AgentComponentConstructorType>(args.file);
    this._name = args.name;
    this._agentComponentConstructor = target;
    this._target = new target(this);
    this._messager = new AgentMessager(this, this.inCommingMessage.mpid);
    if (!(this._target instanceof AgentComponent)) throw new Error('agent component must instanceof AgentComponent');

    this.on('health', (post: (data: any) => any, socket?: any) => this.convertHealth(post, socket));
    this.on('ready', (socket?:any) => {
      if (typeof this._target.ready === 'function') {
        return this._target.ready(socket);
      }
    });
    this.on('hybrid', async (message: MessageReceiveDataOptions, post: (data: any, reply: boolean) => any, socket?: any) => {
      const method = message.method;
      if (this._ipc_pool[method] !== undefined && typeof this._target[method] === 'function') {
        const value = await this._target[method](message.data, socket);
        post(value, this._ipc_pool[method]);
      }
    })
  }

  get messager() {
    return this._messager;
  }

  private async convertHealth(post: (data: any) => any, socket?: any) {
    const result: {
      status: boolean,
      time: Date,
      pid: number,
      value?: any,
    } = {
      status: true,
      time: new Date(),
      pid: process.pid,
    }
    if (this._target.health) {
      const value = await this._target.health(socket);
      if (typeof value === 'object') return post(Object.assign(value, result));
      result.value = value;
    }
    post(result);
  }

  async componentWillCreate() {
    await super.componentWillCreate();
    this.compiler.addCompiler(AgentBootstrapCompiler);
    this._target.beforeCreate && await this._target.beforeCreate();
  }

  async componentDidCreated() {
    await super.componentDidCreated();
    this.resolveWithAgentDecorators();
    this._target.created && await this._target.created();
    await this.emit('AgentStarted');
  }

  async componentWillDestroy() {
    this._target.beforeDestroy && await this._target.beforeDestroy();
    await this.emit('AgentStopping');
  }

  async componentDidDestroyed() {
    this._target.destroyed && await this._target.destroyed();
    await this.emit('AgentStopped');
  }

  componentCatchError(err: Error) {
    this.logger.error(err);
    this._target.catchError && this._target.catchError(err);
  }

  componentReceiveMessage(message: MessageReceiveDataOptions, socket?: any) {
    this.messager.receiveMessage(message, socket);
  }

  private resolveWithAgentDecorators() {
    const targetProperties = Object.getOwnPropertyNames(this._agentComponentConstructor.prototype);
    for (let i = 0; i < targetProperties.length; i++) {
      const property = targetProperties[i];
      const target = this._agentComponentConstructor.prototype[property];
      if (property === 'constructor') continue;
      const schedule: ScheduleDecoratorType = Reflect.getMetadata(DecoratorNameSpace.SCHEDULE, target);
      const isIPC = Reflect.getMetadata(DecoratorNameSpace.IPC, target);
      const isIPCFeedBack = Reflect.getMetadata(DecoratorNameSpace.FEEDBACK, target);
      if (isIPC) this._ipc_pool[property] = !!isIPCFeedBack;
      if (schedule) {
        const job = new CronJob(schedule.cron, () => {
          if (this._target[property]) {
            runFunctionalWithPromise(this._target[property](job)).then(result => {
              if (result === true) job.stop();
            }).catch(e => this.logger.error(e));
          }
        }, undefined, true, undefined, undefined, schedule.runOnInit);
      }
    }
  }
}

export {
  Ipc,
  Auto,
  Namespace,
  Schedule,
  AgentPlugin,
  AgentComponent,
  AgentComponentImplements,
}