import {OrderedMap} from 'immutable';
const hVNode = require('snabbdom/h');
import {hash} from './util';

export default function component({
    model: initialModel,
    components = {},
    view
}) {
    const componentKeys = Object.keys(components);

    let sentInitial = false;
    let previous = {};

    return function ({
        sendNext, componentPath, model, props = {}, update, remove, children = []
    }) {

        if (!sentInitial && initialModel) {
            window.setTimeout(
                () => sendNext(baseModel => baseModel.setIn(componentPath, initialModel)),
                0
            );
            sentInitial = true;
            return hVNode('span', ['loading...']);
        }

        // immutable optimization
        const pathHash = hash(componentPath.join('__'));
        if (previous[pathHash] === undefined) {
            previous[pathHash] = {};
        }
        
        if (previous[pathHash].model == model) {
            console.info('opt used');
            return previous[pathHash].view;
        } else {
            console.log('no opt', model && model.toJS(), previous[pathHash].model && previous[pathHash].model.toJS());
        }
        
        function h (selector, selectorOptions) {
            const {
                mo: _modelKey,
                pr: nestedProps,
                ch: _nestedChildren,
                on,
                ho: hook,
                st: style,
                cl,
                at: attrs
            } = selectorOptions || {};

            const modelKey = String(_modelKey);

            const nestedChildren = (/*if*/ _nestedChildren !== undefined
                ? (/*if*/ typeof _nestedChildren === 'string' || Array.isArray(_nestedChildren)
                    ? _nestedChildren
                    : [_nestedChildren]
                )
                : []
            );
            
            const componentKey = componentKeys.find(key => selector.startsWith(key));
            
            if (componentKey) {
                const componentOptions = components[componentKey];

                const {
                    component: nestedComponent,
                    keyPath = []
                } = (/*if*/ typeof componentOptions === 'function'
                    ? ({component: componentOptions})
                    : (/*if*/ typeof componentOptions.component === 'function'
                        ? componentOptions
                        : (() => {throw `Component '${componentKey}' was configured incorrectly`;})()
                    )
                );

                const localPath = /*if*/ modelKey ? [...keyPath, modelKey] : keyPath;
                const fullPath = [...componentPath, ...localPath];

                const nestedModel = (/*if*/ model.hasIn(localPath)
                    ? model.getIn(localPath)
                    : OrderedMap()
                );

                const nestedUpdate = function (updaterOptions) {
                    const updater = (/*if*/ typeof updaterOptions === 'function'
                        ? updaterOptions
                        : updaterOptions.by
                    );

                    const map = updaterOptions.map;

                    return function (event) {
                        sendNext(baseModel => baseModel.setIn(
                            fullPath,
                            updater(nestedModel, /*if*/ map !== undefined ? map(event) : event)
                        ));
                    }
                }

                const nestedRemove = function () {
                    return function () {
                        sendNext(baseModel => (/*if*/ baseModel.hasIn(fullPath)
                            ? baseModel.removeIn(fullPath)
                            : baseModel
                        ));
                    }
                }

                return nestedComponent({
                    sendNext,
                    componentPath: fullPath,
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

        previous[pathHash].model = model;
        return previous[pathHash].view = view({model, props, update, remove, h, children});
    }
}
