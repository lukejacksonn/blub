import {c as createCommonjsModule}from/*'./_commonjsHelpers-62a4d7f9.js'*/'dd5cfeb195372';import {R as ReactPropTypesSecret}from/*'./checkPropTypes-b5aa2e99.js'*/'e87c0e234e908';function emptyFunction() {}

function emptyFunctionWithReset() {}

emptyFunctionWithReset.resetWarningCache = emptyFunction;

var factoryWithThrowingShims = function () {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      // It is still safe when called from React.
      return;
    }

    var err = new Error('Calling PropTypes validators directly is not supported by the `prop-types` package. ' + 'Use PropTypes.checkPropTypes() to call them. ' + 'Read more at http://fb.me/use-check-prop-types');
    err.name = 'Invariant Violation';
    throw err;
  }
  shim.isRequired = shim;

  function getShim() {
    return shim;
  }
  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.

  var ReactPropTypes = {
    array: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,
    any: shim,
    arrayOf: getShim,
    element: shim,
    elementType: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim,
    exact: getShim,
    checkPropTypes: emptyFunctionWithReset,
    resetWarningCache: emptyFunction
  };
  ReactPropTypes.PropTypes = ReactPropTypes;
  return ReactPropTypes;
};var propTypes = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
{
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = factoryWithThrowingShims();
}
});const {
  array,
  bool,
  func,
  number,
  object,
  string,
  symbol,
  any,
  arrayOf,
  element,
  elementType,
  instanceOf,
  node,
  objectOf,
  oneOf,
  oneOfType,
  shape,
  exact,
  checkPropTypes,
  resetWarningCache,
  PropTypes
} = propTypes;export default propTypes;export{PropTypes,any,array,arrayOf,bool,checkPropTypes,element,elementType,exact,func,instanceOf,node,number,object,objectOf,oneOf,oneOfType,resetWarningCache,shape,string,symbol};
//# sourceURL=https://unpkg.com/es-react@16.12.0/prop-types.js