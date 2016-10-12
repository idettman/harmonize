import {Observable, Subject} from 'rxjs';
import xs, {MemoryStream} from 'xstream';
import {Record, Map} from 'immutable';

export interface VNode {
    sel: string,
    data: any,
    children: VNode[],
    text: string,
    elm: Element,
    key: string | number
}

export interface ExternalUpdater<Model, Value> {
    from: xs<Model>,
    by: (model: Model, value?: Value) => Model
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
    get(key: any): any,
}

function ContainerModel<Model> (containerModel: {
    undoRedoModel: UndoRedo<Model>,
    nestedContainers?: NestedContainers,
    view: ContainerView<Model>
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
}

export default function Container<Model> (
    container: {
        initialState: Model,
        nestedContainers?: {[containerKey: string]: Container<any>},
        view: ContainerView<Model>
    }
): Container<Model> {
    const {initialState, nestedContainers, view} = container;

    const updates$ = xs.never() as xs<(containerModel: ContainerModel<Model>) => ContainerModel<Model>>;
    const sendUpdate = updates$.shamefullySendNext.bind(updates$);

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
                    model: resolveModel(
                        container.nestedContainers[key]
                    )
                }))
                .reduce((nestedObj, nestedContainerModel) => {
                    nestedObj[nestedContainerModel.key] = nestedContainerModel.model;
                    return nestedObj;
                }, {} as {[key: string]: ContainerModel<any>})
            ),
            view: container.view
        });
    }

    const initialContainerModel = resolveModel(container);

    const componentState$ = updates$.fold(
        (state, update) => update(state),
        initialContainerModel
    );

    function resolveView(props: any, containerModel: ContainerModel<any>, chain: string[] = []) {
        const model = containerModel.get('undoRedoModel').get('current');

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

        const lookupChain = chain.reduce(
            (lookupChain, componentKey) => [...lookupChain, 'nestedContainers', componentKey],
            [] as string[]
        );

        const update = (updater: InternalUpdater<Model, any>) => {
            const {by, byInternal} = updater;
            const map = updater.map || ((event) => event);
            if (by && byInternal) throw ('cannot update both internal model and regular model');
            if (by) {
                return (event: any) => (
                    sendUpdate(
                        (containerModel: ContainerModel<Model>) => (
                            (containerModel
                                .updateIn(
                                    [...lookupChain, 'undoRedoModel', 'previousStates'],
                                    previousStates => [
                                        ...previousStates,
                                        containerModel.getIn([...lookupChain, 'undoRedoModel', 'current'])
                                    ]
                                )
                                .setIn(
                                    [...lookupChain, 'undoRedoModel', 'nextStates'],
                                    []
                                )
                                .updateIn(
                                    [...lookupChain, 'undoRedoModel', 'current'],
                                    model => by(model, map(event))
                                )
                            )
                        )
                    )
                );
            }
            return (event: any) => (
                sendUpdate(
                    (containerModel: ContainerModel<Model>) => (
                        containerModel.updateIn(
                            [...lookupChain],
                            m => byInternal(m, map(event))
                        )
                    )
                )
            );
        };

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
        nestedContainers
    };
}
