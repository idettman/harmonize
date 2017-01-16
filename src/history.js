/**
 * very simple history wrapper for immutable js objects
 */
export default function history(model) {
    let undos = [];
    let redos = [];

    function wrap (model) {
        const methodsToWrap = [
            'set', 'delete', 'clear', 'update', 'merge', 'mergeWith', 'mergeDeep', 'mergeDeepWith',
            'setIn', 'deleteIn', 'updateIn', 'mergeIn', 'mergeDeepIn'
        ];
        const wrappedMethods = methodsToWrap.map(methodName => ({
            methodName,
            method: function () {
                console.log('wrapper')
                const lastTodo = undos[undos.length - 1];
                if (lastTodo !== model) {
                    undos.push(model);
                    redos = [];
                }
                const newModel = model['_' + methodName].apply(model, arguments);
                return wrap(newModel);
            }
        })).reduce((obj, {methodName, method}) => {
            if (!model['_' + methodName]) {
                obj['_' + methodName] = model[methodName];
            }
            obj[methodName] = method;
            return obj;
        }, {});

        function undo() {
            if (undos.length) {
                redos.push(model);
                const lastModel = undos.pop();
                return lastModel;
            }
            return model;
        }

        function redo() {
            if (redos.length) {
                undos.push(model);
                const lastModel = redos.pop();
                return lastModel;
            }
            return model;
        }

        return Object.assign(model, wrappedMethods, {undo, redo});
    }

    return wrap(model);
}