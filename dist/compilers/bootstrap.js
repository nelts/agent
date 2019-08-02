"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const globby = require("globby");
const utils_1 = require("@nelts/utils");
async function Bootstrap(plu) {
    const cwd = plu.source;
    const files = await globby([
        'agent.ts',
        'agent.js',
        '!agent.d.ts'
    ], { cwd });
    if (files.length) {
        const file = path.resolve(cwd, files[0]);
        const callback = utils_1.RequireDefault(file);
        if (typeof callback === 'function') {
            await callback(plu);
        }
    }
}
exports.default = Bootstrap;
