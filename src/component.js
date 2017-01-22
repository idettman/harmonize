import {mapObj} from './util';

export default function component({
    components = {},
    view
}) {
    return function ({
        props, model, update, sendNext
        remove = () => {throw `no remove action defined for this component`}
    }) {
        
        mapObj(components, (componentOptions, key) => {
            const resolvedOptions = (/*if*/ typeof componentOptions === 'function'
                ? ({component: componentOptions})
                : componentOptions
            );


            const id = /*if*/ typeof id === 'function' ? id()
        });

        const h = {

        };

       return  view({model, props, update, remove, h});
    }
}

/*

components: (Object
        .keys(components)
        .map(key => ({key, componentOptions: components[key]}))
        .map(({key, componentOptions}) => {

            const {
                component: nestedComponent,
                update: updateSource,
                remove: removeFrom = () => {
                    throw `no remove action defined for this component`
                }
            } = componentOptions;

            const resolvedComponent = (options) => {
                const componentModel = (options.props !== undefined && options.model !== undefined
                    ? options.model
                    : options
                );

                const props = options.props;

                const id = (typeof componentOptions.id === 'function'
                ? componentOptions.id(componentModel)
                    : componentOptions.id
                );

                return nestedComponent({
                    sendNext: (/*if updateSource !== undefined
                        ? (
                            update => sendNext(source => updateSource(
                                source,
                                update(componentModel),
                                id
                            ))
                        )
                        : sendNext
                    ),
                    props,
                    model: componentModel,
                    update: updaterOptions => {
                        const nestedUpdate = (/*if typeof updaterOptions === 'function'
                            ? updaterOptions
                            : updaterOptions.by
                        );
                        const map = updaterOptions.map || (x => x);

                        return event => sendNext(
                            source => {
                                const newNestedModel = nestedUpdate(componentModel, /*with map(event));
                                if (updateSource !== undefined) {
                                    return updateSource(source, newNestedModel, id);
                                } else {
                                    return newNestedModel;
                                }
                            }
                        );
                    },
                    remove: () => (
                        () => sendNext(source => removeFrom(source, id))
                    )
                });
            };

            return {key, resolvedComponent};
        })
        .reduce((resolvedComponents, {key, resolvedComponent}) => {
            resolvedComponents[key] = resolvedComponent;
            return resolvedComponents;
        }, {})
    )}
 */