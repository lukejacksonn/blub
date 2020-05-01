function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}export{createCommonjsModule as c,unwrapExports as u};
//# sourceURL=https://unpkg.com/es-react@16.12.0/_commonjsHelpers-62a4d7f9.js