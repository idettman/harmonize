/**
 * a very simple history wrapper for immutable js objects
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
                return undos.pop();
            }
            return model;
        }

        function redo() {
            if (redos.length) {
                undos.push(model);
                return redos.pop();
            }
            return model;
        }

        function hasUndo() {return undos.length > 0;}
        function hasRedo() {return redos.length > 0;}

        return Object.assign(model, wrappedMethods, {undo, redo, hasUndo, hasRedo});
    }

    return wrap(model);
}
