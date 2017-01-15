export default function component({
    components = {},
    view
}) {
    return ({
        sendNext,
        model,
        update,
        remove = () => {throw `no remove action defined for this component`}
    }) => view({model, update, remove, components: (Object
        .keys(components)
        .map(key => ({key, componentOptions: components[key]}))
        .map(({
            key,
            componentOptions: {
                component: nestedComponent,
                id = () => undefined,
                update: updateSource,
                remove: removeFrom = () => {
                    throw `no remove action defined for this component`
                }
            }
        }) => ({
            key,
            resolvedComponent: (componentModel) => nestedComponent({
                sendNext: update => {
                    sendNext(source => updateSource(
                        source,
                        update(componentModel),
                        id(componentModel)
                    ));
                },
                model: componentModel,
                update: updaterOptions => {
                    const nestedUpdate = (/*if*/ typeof updaterOptions === 'function'
                        ? updaterOptions
                        : updaterOptions.by
                    );
                    const map = updaterOptions.map || (x => x);

                    return event => sendNext(
                        source => {
                            const newNestedModel = nestedUpdate(componentModel, /*with*/ map(event));
                            const newSource = updateSource(source, newNestedModel, id(componentModel));
                            return newSource;
                        }
                    );
                },
                remove: () => (
                    () => sendNext(
                        source => removeFrom(source, id(componentModel))
                    )
                )
            })
        }))
        .reduce((resolvedComponents, {key, resolvedComponent}) => {
            resolvedComponents[key] = resolvedComponent;
            return resolvedComponents;
        }, {})
    )});
}
