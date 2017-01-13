export default function component({
    components = {},
    view
}) {
    return ({sendNext, model, update, remove}) => view({
        model,
        update,
        remove,
        components: (Object
            .keys(components)
            .map(key => ({key, componentOptions: components[key]}))
            .map(({
                key,
                componentOptions: {
                    component: nestedComponent,
                    id = () => undefined,
                    get: getFrom,
                    update: updateSource,
                    remove: removeFrom = () => {
                        throw `no delete action defined for this component`
                    }
                }
            }) => ({
                key,
                resolvedComponent: (componentModel) => nestedComponent({
                    sendNext,
                    model: componentModel,
                    update: updaterOptions => {
                        const nestedUpdate = (/*if*/ typeof updaterOptions === 'function'
                            ? updaterOptions
                            : updaterOptions.by
                        );
                        const map = updaterOptions.map || (x => x);

                        return event => sendNext(
                            source => {
                                const nestedModel = getFrom(source, id(componentModel));
                                const newNestedModel = nestedUpdate(nestedModel, /*with*/ map(event));
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
        )
    });
}
