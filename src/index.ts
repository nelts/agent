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
  private _jobs: { [job:string]: {
    status: boolean,
    job: CronJob,
  } } = {};
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
      switch (method) {
        case 'event:put:job': post(this.startHybridJob(message.data), true); break;
        case 'event:delete:job': post(this.stopHybridJob(message.data), true); break;
        default:
          if (this._ipc_pool[method] !== undefined && typeof this._target[method] === 'function') {
            const value = await this._target[method](message.data, socket);
            post(value, this._ipc_pool[method]);
          }
      }
    })
  }

  get messager() {
    return this._messager;
  }

  private startHybridJob(property: string) {
    const target = this._jobs[property];
    if (!target) return false;
    if (target.status) return true;
    target.job.start();
    this._jobs[property].status = true;
    return true;
  }

  private stopHybridJob(property: string) {
    const target = this._jobs[property];
    if (!target) return false;
    if (!target.status) return true;
    target.job.stop();
    this._jobs[property].status = false;
    return true;
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
    await this.emit('ServerStarted');
  }

  async componentWillDestroy() {
    this._target.beforeDestroy && await this._target.beforeDestroy();
    await this.emit('ServerStopping');
  }

  async componentDidDestroyed() {
    this._target.destroyed && await this._target.destroyed();
    await this.emit('ServerStopped');
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
      this.createNewJob(property, {
        cron: Reflect.getMetadata(DecoratorNameSpace.SCHEDULE, target),
        auto: !!Reflect.getMetadata(DecoratorNameSpace.SCHEDULE_AUTO, target),
        run: !!Reflect.getMetadata(DecoratorNameSpace.SCHEDULE_RUN, target),
      });
      if (Reflect.getMetadata(DecoratorNameSpace.IPC, target)) {
        this._ipc_pool[property] = !!Reflect.getMetadata(DecoratorNameSpace.FEEDBACK, target);
      }
    }
  }

  private createNewJob(property: string, options: {
    cron: ScheduleDecoratorType,
    auto?: boolean,
    run?: boolean,
  }) {
    if (this._jobs[property]) return;
    if (!options.cron) return;
    const job = new CronJob(options.cron, (...args: any[]) => {
      if (this._target[property]) {
        runFunctionalWithPromise(this._target[property](...args)).then(result => {
          if (result === true) {
            job.stop();
            this._jobs[property].status = false;
          }
        }).catch(e => this.logger.error(e));
      }
    }, undefined, false, undefined, this._target, !!options.run);
    options.auto && job.start();
    this._jobs[property] = {
      status: !!options.auto,
      job
    }
    return job;
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