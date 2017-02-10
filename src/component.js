import {OrderedMap} from 'immutable';
import hVNode from 'snabbdom/h';
import thunk from 'snabbdom/thunk';

export default function component({
    model: initialModel,
    components = {},
    view
}) {
    
    const componentKeys = Object.keys(components);

    let sentInitial = false;

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

        function h (selector, vNodeOptions) {
            const {
                mo: _modelKey,
                pr: nestedProps,
                ch: _nestedChildren,
                on,
                ho: hook,
                st: style,
                cl,
                at: attrs
            } = vNodeOptions || {};

            const modelKey = String(_modelKey);

            const nestedChildren = (/*if*/ _nestedChildren !== undefined
                ? (/*if*/ typeof _nestedChildren === 'string' || Array.isArray(_nestedChildren)
                    ? _nestedChildren
                    : [_nestedChildren]
                )
                : []
            );

            const componentKey = componentKeys.find(key => (
                selector.trim().toLowerCase().startsWith(key.toLowerCase())
            ));
            
            if (componentKey) {
                const componentOptions = components[componentKey];

                const nestedComponent = (/*if*/ typeof componentOptions === 'function'
                    ? componentOptions
                    : (/*if*/ typeof componentOptions.component === 'function'
                        ? componentOptions.component
                        : (() => {throw `Component '${componentKey}' was configured incorrectly`;})
                    )
                );

                const keyPath = (/*if*/ typeof componentOptions === 'function'
                    ? []
                    : (/*if*/ typeof componentOptions.keyPath === 'string'
                        ? [componentOptions.keyPath]
                        : (/*if*/ Array.isArray(componentOptions.keyPath)
                            ? componentOptions.keyPath
                            : (() => {throw `Component '${componentKey}'s' keyPath was configured incorrectly`})()
                        )
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

        return view({model, props, update, remove, h, children}) || hVNode('span', ['view must return a vnode']);
    }
}
