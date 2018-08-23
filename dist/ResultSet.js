"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function main(params) {
    const { body } = params;
    if (!body) {
        throw new Error(`ResultSet must be obtained from Cloud Object Storage object with a 'body' argument`);
    }
    return {
        body,
        headers: {
            'Content-Type': 'text/csv'
        },
        statusCode: 200
    };
}
exports.default = main;
