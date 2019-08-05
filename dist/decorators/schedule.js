"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const namespace_1 = require("./namespace");
function Schedule(cron) {
    return (target, property, descriptor) => {
        Reflect.defineMetadata(namespace_1.default.SCHEDULE, cron, descriptor.value);
    };
}
exports.default = Schedule;
Schedule.Auto = function (target, property, descriptor) {
    Reflect.defineMetadata(namespace_1.default.SCHEDULE_AUTO, true, descriptor.value);
};
Schedule.Run = function (target, property, descriptor) {
    Reflect.defineMetadata(namespace_1.default.SCHEDULE_RUN, true, descriptor.value);
};
