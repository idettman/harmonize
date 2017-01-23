import {mapObj} from './util';
import {OrderedMap} from 'immutable';
const hVNode = require('snabbdom/h');

export default function component({
    components = {},
    view
}) {

    const componentKeys = Object.keys(components);

    return function ({
        sendNext, componentPath, model, props, update, children, remove
    }) {
        function h (selector, selectorOptions) {
            const {
                mo: _nestedModel,
                pr: nestedProps,
                ch: nestedChildren,
                on,
                ho: hook,
                st: style,
                cl,
                at: attrs
            } = selectorOptions || {};
            
            const componentKey = componentKeys.find(key => selector.startsWith(key));
            if (componentKey) {
                const componentOptions = components[componentKey];

                const {
                    component: nestedComponent,
                    model: initComponentModel,
                    get: nestedComponentPath,
                    id: _nestedId,
                    update: _nestedUpdatePath,
                    remove: _nestedRemovePath
                } = (/*if*/ typeof componentOptions === 'function'
                    ? ({component: componentOptions})
                    : (/*if*/ typeof componentOptions.component === 'function'
                        ? componentOptions
                        : (() => {throw `Component '${componentKey}' was configured incorrectly`;})()
                    )
                );

                if (_nestedModel !== undefined && nestedComponentPath !== undefined) {
                    throw (`For component '${selector}', you configured a model path from `
                        + `'${componentKey}.get' and also supplied a model via `
                        + `'h(${selector}, {/*...*/, mo: /*value*/)'. Only one model can be used.`
                    );
                }

                if (typeof nestedComponentPath !== 'string'
                    && !Array.isArray(nestedComponentPath)
                    && nestedComponentPath !== undefined
                ) {
                    throw `'${componentKey}.get' must be a string or an array of strings.`
                }

                const nestedModel = (/*if*/ typeof nestedComponentPath === 'string'
                    ? model.get(nestedComponentPath)
                    : (/*if*/ Array.isArray(nestedComponentPath)
                        ? model.getIn(nestedComponentPath)
                        : _nestedModel || initComponentModel || OrderedMap()
                    )
                );

                // assigns all the values of the immutable by key name
                Object.assign(nestedModel, nestedModel.entrySeq().reduce((obj, [key, value]) => {
                    if (nestedModel[key] === undefined) {
                        Object.assign(obj, {get [key] () {return value}});
                    }
                    return obj;
                }, {}));

                const nestedId = (/*if*/ typeof _nestedId === 'string'
                    ? _nestedId
                    : _nestedId(nestedModel)
                );

                const nestedUpdatePath = (/*if*/ typeof _nestedUpdatePath === 'function'
                    ? _nestedUpdatePath(nestedId)
                    : _nestedUpdatePath
                ) || [];

                const nestedRemovePath = (/*if*/ typeof _nestedRemovePath === 'function'
                    ? _nestedRemovePath(nestedId)
                    : _nestedRemovePath
                ) || [];

                const nestedUpdate = function (updaterOptions) {
                    const updater = (/*if*/ typeof updaterOptions === 'function'
                        ? updaterOptions
                        : updaterOptions.by
                    );

                    const map = updaterOptions.map;

                    return function (event) {
                        sendNext(model => model.updateIn(
                            [...componentPath, ...nestedUpdatePath],
                            m => updater(m, /*if*/ map !== undefined ? map(event) : event)
                        ));
                    }
                }

                const nestedRemove = function () {
                    return function () {
                        sendNext(
                            model => model.removeIn([...componentPath, ...nestedRemovePath])
                        );
                    }
                }

                return nestedComponent({
                    sendNext,
                    componentPath: [...componentPath, ...nestedUpdatePath],
                    model: nestedModel,
                    props: nestedProps,
                    update: nestedUpdate,
                    remove: nestedRemove,
                    children: nestedChildren
                });
            } else {
                return hVNode(
                    selector,
                    {on, style, class: cl, attrs, hook, props: nestedProps},
                    nestedChildren
                );
            }
        }

       return  view({model, props, update, remove, h, children});
    }
}
