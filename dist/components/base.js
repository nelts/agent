"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AgentComponent {
    constructor(app) {
        this._app = app;
    }
    get logger() {
        return this._app.logger;
    }
    get messager() {
        return this._app.messager;
    }
    send(method, data, options) {
        return this.messager.send(method, data, options);
    }
    asyncSend(method, data, options) {
        return this.messager.asyncSend(method, data, options);
    }
    asyncHealth() {
        return this.messager.asyncHealth();
    }
    kill() {
        return this._app.kill(process.pid);
    }
    notice(type, data) {
        this.send('notice', { type, data });
    }
}
exports.default = AgentComponent;
