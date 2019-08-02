"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const factory_1 = require("@nelts/factory");
const utils_1 = require("@nelts/utils");
const cron_1 = require("cron");
const messager_1 = require("@nelts/messager");
const plugin_1 = require("./plugin");
exports.AgentPlugin = plugin_1.default;
const base_1 = require("./components/base");
exports.AgentComponent = base_1.default;
exports.AgentComponentImplements = base_1.AgentComponentImplements;
const namespace_1 = require("./decorators/namespace");
const utils_2 = require("@nelts/utils");
const bootstrap_1 = require("./compilers/bootstrap");
const ipc_1 = require("./decorators/ipc");
exports.Ipc = ipc_1.default;
const auto_1 = require("./decorators/auto");
exports.Auto = auto_1.default;
const namespace_2 = require("./decorators/namespace");
exports.Namespace = namespace_2.default;
const schedule_1 = require("./decorators/schedule");
exports.Schedule = schedule_1.default;
class AgentFactory extends factory_1.Factory {
    constructor(processer, args) {
        super(processer, args, plugin_1.default);
        this._ipc_pool = {};
        const target = utils_1.RequireDefault(args.file);
        this._name = args.name;
        this._agentComponentConstructor = target;
        this._target = new base_1.default(this);
        this._messager = new messager_1.Agent(this, this.inCommingMessage.mpid);
        if (!(this._target instanceof base_1.default))
            throw new Error('agent component must instanceof AgentComponent');
        this.on('ready', (socket) => this._target.ready(socket));
        this.on('health', async (post, socket) => post(await this._target.health(socket)));
        this.on('hybrid', async (message, post, socket) => {
            const method = message.method;
            if (this._ipc_pool[method] !== undefined && this._target[method]) {
                const value = await this._target[method](message.data, socket);
                post(value, this._ipc_pool[method]);
            }
        });
    }
    get messager() {
        return this._messager;
    }
    async componentWillCreate() {
        await super.componentWillCreate();
        this.compiler.addCompiler(bootstrap_1.default);
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
    componentCatchError(err) {
        this.logger.error(err);
        this._target.catchError && this._target.catchError(err);
    }
    componentReceiveMessage(message, socket) {
        this.messager.receiveMessage(message, socket);
    }
    resolveWithAgentDecorators() {
        const targetProperties = Object.getOwnPropertyNames(this._agentComponentConstructor.prototype);
        for (let i = 0; i < targetProperties.length; i++) {
            const property = targetProperties[i];
            const target = this._agentComponentConstructor.prototype[property];
            if (property === 'constructor')
                continue;
            const schedule = Reflect.getMetadata(namespace_1.default.SCHEDULE, target);
            const isIPC = Reflect.getMetadata(namespace_1.default.IPC, target);
            const isIPCFeedBack = Reflect.getMetadata(namespace_1.default.FEEDBACK, target);
            if (isIPC)
                this._ipc_pool[property] = !!isIPCFeedBack;
            if (schedule) {
                const job = new cron_1.CronJob(schedule.cron, () => {
                    if (this._target[property]) {
                        utils_2.runFunctionalWithPromise(this._target[property](job)).then(result => {
                            if (result === true)
                                job.stop();
                        }).catch(e => this.logger.error(e));
                    }
                }, undefined, true, undefined, undefined, schedule.runOnInit);
            }
        }
    }
}
exports.default = AgentFactory;
