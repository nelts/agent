import 'reflect-metadata';
import { WidgetComponent, Processer } from '@nelts/process';
import { Factory, InCommingMessage } from '@nelts/factory';
import { Agent as AgentMessager, MessageReceiveDataOptions } from '@nelts/messager';
import AgentPlugin from './plugin';
import AgentComponent, { AgentComponentImplements } from './components/base';
export default class AgentFactory extends Factory<AgentPlugin> implements WidgetComponent {
    private _name;
    private _agentComponentConstructor;
    private _target;
    private _messager;
    private _ipc_pool;
    constructor(processer: Processer, args: InCommingMessage);
    readonly messager: AgentMessager<this>;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentWillDestroy(): Promise<void>;
    componentDidDestroyed(): Promise<void>;
    componentCatchError(err: Error): void;
    componentReceiveMessage(message: MessageReceiveDataOptions, socket?: any): void;
    private resolveWithAgentDecorators;
}
export { AgentPlugin, AgentComponent, AgentComponentImplements, };
