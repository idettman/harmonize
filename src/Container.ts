import xs, {MemoryStream} from 'xstream';
import {Record, Map} from 'immutable';
import {VNode} from './harmonize';

/**
 * Updaters are functions that take in a model and return a new model
 */
export interface Updater<Model> {(model: Model): Model}

export interface ExternalUpdater<Model, Value> {
    from: xs<Model>,
    by?: (model: Model, value?: Value) => Model,
    byInternal?: (
        internalModel: ContainerModel<Model>,
        value?: Value
    ) => ContainerModel<Model>
}

export interface InternalUpdater<Model, Value> {
    map?: (event: Event) => Value,
    by?: (model: Model, value?: Value) => Model,
    byInternal?: (
        internalModel: ContainerModel<Model>,
        value?: Value
    ) => ContainerModel<Model>
}

export interface ContainerViewOptions<Model> {
    model: Model,
    update: (updater: InternalUpdater<Model, any>) => void,
    containers?: {[key: string]: (props?: any) => VNode}
    props?: any,
    modules?: any
}

export interface View<Model> {
    (model: Model): VNode
}

export interface ContainerView<Model> {
    (options: ContainerViewOptions<Model>): VNode
}

export interface UndoRedo<Model> extends Map<string, any> {
    get(key: 'current'): Model,
    get(key: 'nextStates'): Model[],
    get(key: 'previousStates'): Model[],
    get(key: any): any
}

export function UndoRedo<Model> (undoRedoModel: {
    current: Model,
    nextStates: Model[],
    previousStates: Model[]
}) {
    return Map(undoRedoModel) as UndoRedo<Model>;
}

/**
 * The actual model of a `Container` under the hood.
 */
export interface ContainerModel<Model> extends Map<string, any> {
    get(key: 'undoRedoModel'): UndoRedo<Model>,
    get(key: 'nestedContainers'): NestedContainers,
    get(key: 'view'): ContainerView<Model>,
    get(key: 'sendUpdate'): (updater: Updater<ContainerModel<Model>>) => void
    get(key: any): any,
}

function ContainerModel<Model> (containerModel: {
    undoRedoModel: UndoRedo<Model>,
    nestedContainers?: NestedContainers,
    view: ContainerView<Model>,
    sendUpdate: (updater: Updater<ContainerModel<Model>>) => void
}) {
    return Map(containerModel) as ContainerModel<Model>;
}

export interface NestedContainers extends Map<string, any> {
    get(key: string): ContainerModel<any>
}
function NestedContainers<Model>(nestedContainers: {[key: string]: ContainerModel<Model>}) {
    return Map(nestedContainers) as NestedContainers;
}

/**
 * This is the type the container returns
 */
export interface Container<Model> {
    initialState: Model,
    view: ContainerView<Model>,
    nestedContainers?: {[containerKey: string]: Container<any>}
    state$?: MemoryStream<Model>,
    componentState$?: MemoryStream<ContainerModel<Model>>,
    view$?: MemoryStream<VNode>,
    sendUpdate: (updater: Updater<ContainerModel<Model>>) => void
}

export default function container<Model> (
    container: {
        initialState: Model,
        update?: (modules?: any) => ExternalUpdater<any, any>[],
        nestedContainers?: {[containerKey: string]: Container<any>},
        view: ContainerView<Model>
    }
): Container<Model> {
    const {initialState, nestedContainers, view} = container;
    const update = container.update || ((modules?: any) => []);

    const nestedContainerList = (Object
        .keys(nestedContainers || {})
        .map(key => ({
            key,
            container: nestedContainers[key]
        }))
    );

    const components$ = (nestedContainerList
        .map(({key, container}) => (container.componentState$
            .map(state => (
                (model: ContainerModel<Model>) => (
                    model.setIn(['nestedContainers', key], state) as ContainerModel<Model>
                )
            ))
        ))
    );

    const internalUpdates$: (
        xs<(containerModel: ContainerModel<Model>) => ContainerModel<Model>>
    ) = xs.never();

    const undo: InternalUpdater<any, any> = {
        map: event => event,
        byInternal: (model) => {
            const previousStates = model.getIn(['undoRedoModel', 'previousStates']);
            if (previousStates.length === 0) return model;
            return (model
                .updateIn(
                    ['undoRedoModel', 'nextStates'],
                    nextStates => [
                        ...nextStates,
                        model.getIn(['undoRedoModel','current'])
                    ]
                )
                .setIn(
                    ['undoRedoModel', 'current'],
                    previousStates[previousStates.length - 1]
                )
                .updateIn(
                    ['undoRedoModel', 'previousStates'],
                    previousStates => previousStates.slice(
                        0,
                        previousStates.length - 1
                    )
                )
            )
        }
    }

    const redo: InternalUpdater<any, any> = {
        map: event => event,
        byInternal: (model) => {
            const nextStates = model.getIn(['undoRedoModel', 'nextStates']);
            if (nextStates.length === 0) return model;
            return (model
                .updateIn(
                    ['undoRedoModel', 'previousStates'],
                    previousStates => [
                        ...previousStates,
                        model.getIn(['undoRedoModel','current'])
                    ]
                )
                .setIn(
                    ['undoRedoModel', 'current'],
                    nextStates[nextStates.length - 1]
                )
                .updateIn(
                    ['undoRedoModel', 'nextStates'],
                    nextStates => nextStates.slice(
                        0,
                        nextStates.length - 1
                    )
                )
            )
        }
    }

    const modules = { undo, redo };

    const externalUpdates$ = update(modules).map(
        ({from: externalStream$, by: updateModel, byInternal: updateContainerModel}) => {

            if (updateModel && updateContainerModel) throw `that won't work`
            // map the external stream to a function
            // that updates this container Model
            if (updateModel) {
                return externalStream$.map(
                    (streamValue: any) => (
                        (containerModel: ContainerModel<Model>) => (
                            (containerModel
                                .updateIn(
                                    ['undoRedoModel', 'previousStates'],
                                    previousStates => [
                                        ...previousStates,
                                        containerModel.getIn(['undoRedoModel', 'current'])
                                    ]
                                )
                                .setIn(
                                    ['undoRedoModel', 'nextStates'],
                                    []
                                )
                                .updateIn(
                                    ['undoRedoModel', 'current'],
                                    model => updateModel(model, streamValue)
                                )
                            )
                        )
                    )
                )
            }
            
            return externalStream$.map(
                (streamValue: any) => (
                    (containerModel: ContainerModel<Model>) => (
                        containerModel.update(self => updateContainerModel(
                            self,
                            streamValue
                        ))
                    )
                )
            )
        }
    );

    /**
     * sendUpdate is a function that takes in an Updater and returns void
     * To send an update, you send a function that modifies the model. This
     * returns a stream
     */
    const sendUpdate: (updater: Updater<ContainerModel<Model>>) => void = (
        internalUpdates$.shamefullySendNext.bind(internalUpdates$)
    );

    function resolveModel<M>(container: Container<M>): ContainerModel<M> {
        return ContainerModel({
            undoRedoModel: UndoRedo({
                current: container.initialState,
                nextStates: [],
                previousStates: []
            }),
            nestedContainers: NestedContainers(Object
                .keys(container.nestedContainers || {})
                .map(key => ({
                    key,
                    model: resolveModel(container.nestedContainers[key])
                }))
                .reduce((nestedObj, nestedContainer) => {
                    nestedObj[nestedContainer.key] = nestedContainer.model;
                    return nestedObj;
                }, {} as {[key: string]: ContainerModel<any>})
            ),
            view: container.view,
            sendUpdate: container.sendUpdate
        });
    }

    const initialContainerModel = resolveModel({
        initialState,
        nestedContainers,
        view,
        sendUpdate
    });

    const componentState$ = xs.merge(...components$, ...externalUpdates$, internalUpdates$).fold(
        (state, update) => update(state),
        initialContainerModel
    );

    function resolveView(props: any, containerModel: ContainerModel<any>, chain: string[] = []) {
        const model = containerModel.get('undoRedoModel').get('current');
        const nestedSendUpdate = containerModel.get('sendUpdate');

        const containers = (containerModel
            .get('nestedContainers')
            .keySeq()
            .map(key => ({
                key,
                container: containerModel.get('nestedContainers').get(key)
            }))
            .map(({key, container}) => ({
                key,
                resolvedView: (props?: any) => (
                    resolveView(props, container, [...chain, key])
                )
            }))
            .reduce(
                (obj, {key, resolvedView}) => {
                    obj[key] = resolvedView;
                    return obj;
                },
                {} as {[key: string]: (props?: any) => VNode}
            )
        );

        const update = (updater: InternalUpdater<Model, any>) => {
            const {by: updateModel, byInternal: updateContainerModel} = updater;
            const map = updater.map || ((event) => event);
            if (updateModel && updateContainerModel) throw (
                'cannot update both internal model and regular model'
            );
            if (updateModel) {
                return (event: any) => (
                    nestedSendUpdate(
                        (containerModel: ContainerModel<Model>) => (
                            (containerModel
                                .updateIn(
                                    ['undoRedoModel', 'previousStates'],
                                    previousStates => [
                                        ...previousStates,
                                        containerModel.getIn(['undoRedoModel', 'current'])
                                    ]
                                )
                                .setIn(
                                    ['undoRedoModel', 'nextStates'],
                                    []
                                )
                                .updateIn(
                                    ['undoRedoModel', 'current'],
                                    model => updateModel(
                                        model,
                                        /*with*/ map(event)
                                    )
                                )
                            )
                        )
                    )
                );
            }
            return (event: any) => (
                nestedSendUpdate(
                    (containerModel: ContainerModel<Model>) => (
                        containerModel.update(self => updateContainerModel(
                            self,
                            /*with*/ map(event)
                        ))
                    )
                )
            );
        };

        const view = containerModel.get('view');
        return view({model, containers, update, props, modules});
    }

    const resolvedView = (containerModel: ContainerModel<any>) => (
        resolveView(null, containerModel)
    );

    const view$ = componentState$.map(state => resolvedView(state));

    return {
        componentState$,
        state$: componentState$.map(componentState => (
            componentState.getIn(['undoRedoModel', 'current'])
        )),
        view,
        view$,
        initialState,
        nestedContainers,
        sendUpdate
    };
}
