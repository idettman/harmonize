import {Observable, Subject} from 'rxjs';
import xs from 'xstream';
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
    by: (model: Model, value?: Value) => Model
}

export interface ContainerView<Model> {
    (options: {
        model: Model,
        update: (updater: InternalUpdater<Model, any>) => void,
        containers?: {[key: string]: (props: any) => VNode}
        props?: any
    }): VNode
}

export interface UndoRedo<Model> extends Map<string, any> {
    get(key: 'current'): Model,
    get(key: 'nextStates'): Model[],
    get(key: 'previousStates'): Model[],
    get(key: any): any
}

/**
 * The actual model of a `Container` under the hood.
 */
export interface ContainerModel<Model> {
    undoRedoModel: {
        current: Model,
        nextStates: Model[],
        previousStates: Model[]
    },
    nestedContainers: {[containerKey: string]: ContainerModel<any>},
    view: ContainerView<Model>
}

export default function Container<Model>(
    options: {
        initialState: Model,
        nestedContainers?: {[containerKey: string]: ContainerModel<any>},
        view: ContainerView<Model>
    }
) {
    const {initialState, nestedContainers, undo, redo, view} = options;

    const updates$ = xs.never() as xs<(model: Model) => Model>;
    const sendUpdate = updates$.shamefullySendNext.bind(updates$);

    const UndoRedoRecord = Record({
        current: initialState,
        nextStates: [],
        previousStates: []
    }) as new () => UndoRedo<Model>;

    const state$ = xs.merge(updates$, undoRedos$).fold(
        (state: UndoRedo<Model>, updateOrUndoRedo: any) => {
            console.log('updateOrUndoRedo', updateOrUndoRedo);
            switch(updateOrUndoRedo) {
                case 'UNDO':
                    const previousStates = state.get('previousStates');
                    return /*if*/ previousStates.length === 0 ? (state) : (
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
                    return /*if*/ nextStates.length === 0 ? (state) : (
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
        },
        new UndoRedoRecord()
    ) as xs<UndoRedo<Model>>;

    const update = (updater: InternalUpdater<Model, any>) => {
        const {map, by} = updater;
        return (event: any) => (
            sendUpdate(
                (model: Model) => by(model, map(event))
            )
        )
    };

    return state$.map(state => view({model: state.get('current'), update}));
}
