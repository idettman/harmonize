import {assignKeys} from './util';
import {OrderedMap} from 'immutable';
const hVNode = require('snabbdom/h');

export default function component({
    name,
    model: _initialModel,
    components = {},
    view
}) {
    const componentKeys = Object.keys(components);
    const initialModel = _initialModel && assignKeys(_initialModel);

    console.log(name, initialModel && initialModel.toJS());

    return function ({
        sendNext, componentPath, model: _model, props = {}, update, remove, children = []
    }) {
        const model = (/*if*/ _model._isDefaultMap
            ? initialModel || Object.defineProperty(OrderedMap(), '_isDefaultMap', {value: true})
            : _model
        );

        // const imodel = (/*if*/ model._isDefaultMap
        //     ? initialModel || Object.defineProperty(OrderedMap(), '_isDefaultMap', {value: true})
        //     : _model
        // );

        // //console.log(componentPath, model.toJS());


        // console.log(componentPath, imodel.toJS());
        // sendNext(baseModel => {
        //     return baseModel.setIn(componentPath, imodel);
        // });
        
        function h (selector, selectorOptions) {
            const {
                mo: modelKey,
                pr: nestedProps,
                ch: _nestedChildren,
                on,
                ho: hook,
                st: style,
                cl,
                at: attrs
            } = selectorOptions || {};

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

                const localPath = /*if*/ modelKey ? [...keyPath, (modelKey + '')] : keyPath;
                const fullPath = [...componentPath, ...localPath];

                const nestedModel = (/*if*/ model.hasIn(localPath)
                    ? model.getIn(localPath)
                    : OrderedMap()
                );

                assignKeys(nestedModel);

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

        return view({model, props, update, remove, h, children});
    }
}
