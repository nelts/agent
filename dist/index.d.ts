import 'reflect-metadata';
import { WidgetComponent, Processer } from '@nelts/process';
import { Factory, InCommingMessage } from '@nelts/factory';
import { Agent as AgentMessager, MessageReceiveDataOptions } from '@nelts/messager';
import AgentPlugin from './plugin';
import AgentComponent, { AgentComponentImplements } from './components/base';
import Ipc from './decorators/ipc';
import Auto from './decorators/auto';
import Namespace from './decorators/namespace';
import Schedule from './decorators/schedule';
export default class AgentFactory extends Factory<AgentPlugin> implements WidgetComponent {
    private _name;
    private _agentComponentConstructor;
    private _target;
    private _messager;
    private _ipc_pool;
    constructor(processer: Processer, args: InCommingMessage);
    readonly messager: AgentMessager<this>;
    private convertHealth;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentWillDestroy(): Promise<void>;
    componentDidDestroyed(): Promise<void>;
    componentCatchError(err: Error): void;
    componentReceiveMessage(message: MessageReceiveDataOptions, socket?: any): void;
    private resolveWithAgentDecorators;
}
export { Ipc, Auto, Namespace, Schedule, AgentPlugin, AgentComponent, AgentComponentImplements, };
