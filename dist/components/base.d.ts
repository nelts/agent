import AgentFactory from '../index';
import { MessageSendOptions } from '@nelts/messager';
export default class AgentComponent {
    private _app;
    constructor(app: AgentFactory);
    readonly logger: import("log4js").Logger;
    readonly messager: import("@nelts/messager").Agent<AgentFactory>;
    send(method: string, data?: any, options?: MessageSendOptions): number;
    asyncSend(method: string, data?: any, options?: MessageSendOptions): Promise<any>;
    asyncHealth(): Promise<any>;
    kill(): void;
    notice(type: string, data: any): void;
}
export declare class AgentComponentImplements extends AgentComponent {
    constructor(app: AgentFactory);
    beforeCreate?(): Promise<void>;
    created?(): Promise<void>;
    beforeDestroy?(): Promise<void>;
    destroyed?(): Promise<void>;
    catchError?(err: Error): Promise<void>;
    ready?(socket?: any): Promise<void>;
    health?<T = any>(socket: any): Promise<T>;
    [name: string]: any;
}
