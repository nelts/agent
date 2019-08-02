"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const namespace_1 = require("./namespace");
exports.default = (isFeedBack) => {
    return (target, property, descriptor) => {
        Reflect.defineMetadata(namespace_1.default.IPC, true, descriptor.value);
        Reflect.defineMetadata(namespace_1.default.FEEDBACK, !!isFeedBack, descriptor.value);
    };
};
