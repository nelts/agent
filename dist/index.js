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
        this._jobs = {};
        const target = utils_1.RequireDefault(args.file);
        this._name = args.name;
        this._agentComponentConstructor = target;
        this._target = new target(this);
        this._messager = new messager_1.Agent(this, this.inCommingMessage.mpid);
        if (!(this._target instanceof base_1.default))
            throw new Error('agent component must instanceof AgentComponent');
        this.on('health', (post, socket) => this.convertHealth(post, socket));
        this.on('ready', (socket) => {
            if (typeof this._target.ready === 'function') {
                return this._target.ready(socket);
            }
        });
        this.on('hybrid', async (message, post, socket) => {
            const method = message.method;
            if (method === 'event:put:job') {
                this.hybridJob(message.data);
                post(true, true);
            }
            else if (this._ipc_pool[method] !== undefined && typeof this._target[method] === 'function') {
                const value = await this._target[method](message.data, socket);
                post(value, this._ipc_pool[method]);
            }
        });
    }
    get messager() {
        return this._messager;
    }
    hybridJob(data) {
        const target = this._agentComponentConstructor.prototype[data.property];
        if (target) {
            const schedule = Reflect.getMetadata(namespace_1.default.SCHEDULE, target);
            const schedule_auto = Reflect.getMetadata(namespace_1.default.SCHEDULE_AUTO, target);
            const schedule_run = Reflect.getMetadata(namespace_1.default.SCHEDULE_RUN, target);
            if (schedule) {
                this.createNewJob(data.property, {
                    cron: schedule,
                    auto: data.auto || !!schedule_auto,
                    run: data.run || !!schedule_run,
                });
            }
        }
    }
    async convertHealth(post, socket) {
        const result = {
            status: true,
            time: new Date(),
            pid: process.pid,
        };
        if (this._target.health) {
            const value = await this._target.health(socket);
            if (typeof value === 'object')
                return post(Object.assign(value, result));
            result.value = value;
        }
        post(result);
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
            this.hybridJob({ property: property });
            const isIPC = Reflect.getMetadata(namespace_1.default.IPC, target);
            const isIPCFeedBack = Reflect.getMetadata(namespace_1.default.FEEDBACK, target);
            if (isIPC)
                this._ipc_pool[property] = !!isIPCFeedBack;
        }
    }
    createNewJob(property, options) {
        if (this._jobs[property])
            return;
        const job = new cron_1.CronJob(options.cron, (...args) => {
            if (this._target[property]) {
                utils_2.runFunctionalWithPromise(this._target[property](...args)).then(result => {
                    if (result === true) {
                        job.stop();
                        delete this._jobs[property];
                    }
                }).catch(e => this.logger.error(e));
            }
        }, undefined, !!options.auto, undefined, this._target, !!options.run);
        this._jobs[property] = job;
        return job;
    }
}
exports.default = AgentFactory;
