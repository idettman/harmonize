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
    props?: any
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
            nestedContainers: NestedContainers(
                Object.keys(container.nestedContainers || {}
                ).map(key => ({
                    key,
                    model: resolveModel(
                        container.nestedContainers[key]
                    )
                })).reduce((nestedObj, nestedContainerModel) => {
                    nestedObj[nestedContainerModel.key] = nestedContainerModel.model;
                    return nestedObj;
                }, {} as {[key: string]: ContainerModel<any>})
            ),
            view: container.view
        });
    }

    const initialContainerModel = resolveModel(container);

    console.log('initialContainerModel', initialContainerModel);

    const componentState$ = updates$.fold(
        (state, update) => update(state),
        initialContainerModel
    );

    function resolve<M>(container: ContainerModel<M>, chain: string[]) {

        const UndoRedo = Map({
            current: initialState,
            nextStates: [],
            previousStates: []
        }) as UndoRedo<Model>;

        const nestedContainerList = Object.keys(nestedContainers).map(nestedKey => ({
            key: nestedKey,
            initialState: nestedContainers[nestedKey].initialState,
            view: nestedContainers[nestedKey].view,
            model: nestedContainers[nestedKey].
        }));

        const NestedContainersRecord = Record(nestedContainerList.reduce(
            (nestedContainerObj, nestedContainer) => {
                nestedContainerObj[nestedContainer.key] = nestedContainer.
                return nestedContainerObj;
            },
            {} as any
        )) as new () => NestedContainers;

        const ContainerModelRecord = Record({
            undoRedoModel: UndoRedo,
            nestedContainers: new NestedContainersRecord(),

        });


        const update = (updater: InternalUpdater<Model, any>) => {
            const {map, by, byInternal} = updater;
            if (by && byInternal) throw ('cannot update both internal model and regular model');
            if (by) {
                return (event: any) => (
                    sendUpdate(
                        (containerModel: ContainerModel<Model>) => (
                            containerModel.update(
                                'previousStates',
                                previousStates => [...previousStates, containerModel.get('current')]
                            ).set(
                                'nextStates', []
                            ).update(
                                'current', model => by(model, map(event))
                            )
                        )
                    )
                );
            }
            return (event: any) => (
                sendUpdate(
                    (containerModel: ContainerModel<Model>) => (
                        containerModel.update(m => byInternal(m, map(event)))
                    )
                )
            );
        };

    }

    function resolveView<M>(
        containerModel: ContainerModel<M>,
        chain: string[],
    ): ContainerViewOptions<M> {
        const lookupChain = chain.map(nestedKey => (['']));
        return {
            model: containerModel.get('undoRedoModel').get('current'),
            
        };
    }

    const resolvedView = resolveView()

    const view$ = componentState$.map(state => view(state));

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

/*

const nestedContainer = Container({
    initialState: new Record({someKey: 'value'}),
    view: ({model: {someKey}, update}) => h('div', {
        on: {click: update({by: model => model + 1})}
    }, [])
});

const container = Container({
    initialState: new Record({
        count: 0,
        word: 'world!'
    }),
    update: [{
        from$: ,
        by: 
    }],
    view: ({
        model: {count, word},
        update,
        containers: {nestedContainer}
    }) => h('div', {
        on: {click: update({
            from: event => event.target.value,
            by: (model, value) => model.set('a', value)
        })}
    })
});


{
            console.log('updateOrUndoRedo', updateOrUndoRedo);
            switch(updateOrUndoRedo) {
                case 'UNDO':
                    const previousStates = state.get('previousStates');
                    return previousStates.length === 0 ? (state) : (
                        state.update(
                            'nextStates',
                            nextStates => [...nextStates, state.get('current')]
                        ).set(
                            'current',
                            previousStates[previousStates.length - 1]
                        ).update(
                            'previousStates',
                            previousStates => [...previousStates].slice(0, previousStates.length - 1)
                        )
                    )
                case 'REDO':
                    const nextStates = state.get('nextStates');
                    return nextStates.length === 0 ? (state) : (
                        state.update(
                            'previousStates',
                            previousStates => [...previousStates, state.get('current')]
                        ).set(
                            'current',
                            nextStates[nextStates.length - 1]
                        ).update(
                            'nextStates',
                            nextStates => [...nextStates].slice(0, nextStates.length - 1)
                        )
                    );
                default: return state.update(
                    'previousStates',
                    previousStates => [...previousStates, state.get('current')]
                ).set(
                    'nextStates', []
                ).update(
                    'current', s => updateOrUndoRedo(s)
                );
            }
        }

*/