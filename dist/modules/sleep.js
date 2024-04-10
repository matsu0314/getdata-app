"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sleep = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};
exports.default = sleep;
