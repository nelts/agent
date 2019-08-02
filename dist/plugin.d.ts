import { Plugin } from '@nelts/factory';
import AgentFactory from './index';
import { MessageSendOptions } from '@nelts/messager';
export default class AgentPlugin extends Plugin<AgentFactory> {
    constructor(app: AgentFactory, name: string, cwd: string);
    readonly messager: import("@nelts/messager").Agent<AgentFactory>;
    send(method: string, data?: any, options?: MessageSendOptions): number;
    asyncSend(method: string, data?: any, options?: MessageSendOptions): Promise<any>;
    asyncHealth(): Promise<any>;
    kill(): void;
    notice(type: string, data: any): void;
}
