import xs, {MemoryStream, Stream} from 'xstream';
//import {DOMSource, VNode, VNodeData, div} from '@cycle/dom';
import {Record, Map} from 'immutable';
import fromEvent from 'xstream/extra/fromEvent';
import * as most from 'most';

declare function require(path: string) : any;
declare type VNode = any;
declare type VNodeData = any;

const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const patch = snabbdom.init([
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners')
]);

//export interface Sources { DOM: DOMSource }

export interface ExternalUpdater<Value, Model> {
    from$: Stream<Value>,
    by: (model: Model, value: Value) => Model
}

export interface InternalUpdater<Model, Event> {
    (model: Model, event: Event): Model
}

/**
 * Interface for the view of a container.
 * Note that this interface is a `Function Type`
 */
export interface ContainerView<Model, Props> {(
    options: {
        model: Model,
        containers: { [key: string]: (props?: any) => VNode },
        update: (updater: InternalUpdater<Model, Event>) => void,
        props?: Props
    }
): VNode}

export interface Container<Model, Props> {
    containerModel$: MemoryStream<ContainerRecord<Model, any>>,
    model$: MemoryStream<Model>,
    DOM: MemoryStream<VNode>,
    view: ContainerView<Model, Props>
}

export interface ContainersRecord<Props> extends Map<string, any> {
    get(key: string): ContainerRecord<any, Props>
}

export interface UndoRedoWrapper<Model> extends Map<string, any> {
    get(key: 'current'): Model,
    get(key: 'previousModels'): Model[],
    get(key: 'nextModels'): Model[],
    get(key: any): any
}

export interface ContainerRecord<Model, Props> extends Map<string, any> {
    get(key: 'containers'): ContainersRecord<Props>,
    get(key: 'model'): Model,
    get(key: 'wrappedModel'): UndoRedoWrapper<Model>,
    get(key: 'view'): ContainerView<Model, Props>,
    get(key: any): any,
}


// function UndoRedoWrapper<Model>(model: Model) {
//     const UndoRedoRecord = Record({
//         current: model,
//         previousModels: [],
//         nextModels: []
//     });
//     return new UndoRedoRecord() as UndoRedoWrapper<Model>;
// }

export function Container<Model, Containers, Props> (
    params: {
        containers?: { [key: string]: Container<any, any> },
        model: Model,
        update?: ExternalUpdater<any, Model>[],
        undo?: xs<any>,
        redo?: xs<any>
        view: ContainerView<Model, Props>
    }
): Container<Model, Props> {
    const {model, update, view, undo, redo} = params;

    // get the containers objects as a list of containers tuples
    const containerNames = /*if*/ params.containers ? (
        Object.keys(params.containers)
    ) : ([]);

    const containers = containerNames.map(name => ({
        name,
        containerModel$: (params.containers[name].containerModel$),
        view: params.containers[name].view
    }));

    const emptyContainers = containerNames.reduce(
        (obj, name) => { obj[name] = null; return obj; },
        {} as any
    );
    
    const ContainersRecord = Record(
        emptyContainers
    ) as new () => ContainersRecord<any>;

    const UndoRedoWrapper = Record({
        current: model,
        previousModels: [],
        nextModels: []
    }) as new () => UndoRedoWrapper<Model>;

    const ContainerRecord = Record({
        wrappedModel: new UndoRedoWrapper(),
        //model,
        view,
        containers: new ContainersRecord()
    }) as new () => ContainerRecord<Model, any>;

    const container$s = containers.map(({name, containerModel$}) => (
        containerModel$.map(containerModel => (
            (model: ContainerRecord<Model, any>) => model.setIn(
                ['containers', name],
                containerModel
            ) as ContainerRecord<Model, any>
        ))
    ));

    /** Maps the `update: { ... }` objects to an array. The keys don't do anything. */
    const externalUpdaters = update || [];
    const externalUpdates$ = externalUpdaters.map(updater => {
        const { from$, by } = updater;
        const updater$s = from$.map(value => ((model: Model) => by(model, value)));
        return updater$s.map(updater => (
            (model: ContainerRecord<Model, Props>) => (
                model.updateIn(
                    ['wrappedModel', 'current'],
                    updater
                ) as ContainerRecord<Model, Props>
            ))
        );
    });

    const internalUpdaters$ = xs.never();
    const internalUpdates$ = internalUpdaters$.map(
        eventUpdater => (model: ContainerRecord<Model, Props>) => (
            model.update(eventUpdater) as ContainerRecord<Model, Props>
        )
    );

    const containerModel$ = xs.merge(
        ...externalUpdates$ as any,
        ...container$s as any,
        internalUpdates$ as any,
        undo.mapTo('UNDO') as any,
        redo.mapTo('REDO') as any
    ).fold(
        (containerModel, u) => {
            const update = u as any;
            console.log('containerModel', containerModel);
            switch(update) {
                case 'UNDO':
                    const previousModels = containerModel.getIn(['wrappedModel', 'previousModels']);
                    return /*if*/ previousModels.length === 0 ? (containerModel) : (
                        containerModel.updateIn(
                            ['wrappedModel', 'nextModels'],
                            nextModels => [...nextModels, containerModel.getIn(['wrappedModel', 'current'])]
                        ).setIn(
                            ['wrappedModel', 'current'],
                            previousModels[previousModels.length - 1]
                        ).updateIn(
                            ['wrappedModel', 'previousModels'],
                            previousModels => [...previousModels].slice(0, previousModels.length - 1)
                        )
                    );
                case 'REDO':
                    const nextModels = containerModel.getIn(['wrappedModel', 'nextModels']);
                    return /*if*/ nextModels.length === 0 ? (containerModel) : (
                        containerModel.updateIn(
                            ['wrappedModel', 'previousModels'],
                            previousModels => [...previousModels, containerModel.getIn(['wrappedModel', 'current'])]
                        ).setIn(
                            ['wrappedModel', 'current'],
                            nextModels[nextModels.length - 1]
                        ).updateIn(
                            ['wrappedModel', 'nextModels'],
                            nextModels => [...nextModels].slice(0, nextModels.length - 1)
                        )
                    );
                default: return containerModel.updateIn(
                    ['wrappedModel', 'previousModels'],
                    previousModels => [...previousModels, containerModel.getIn(['wrappedModel', 'current'])]
                ).setIn(
                    ['wrappedModel', 'nextModels'], []
                ).update(update);
            }
        },
        new ContainerRecord()
    );

    const sendNext = internalUpdaters$.shamefullySendNext.bind(internalUpdaters$);

    function resolve(container: ContainerRecord<any, any>, chain: string[]): any {
        const model = container.get('wrappedModel');
        console.log('wrappedModel', model);
        const lookupChain = chain.reduce(
            (chain, containerKey) => [...chain, 'containers', containerKey],
            [] as string[]
        );

        console.log('lookup chain', [...lookupChain, 'wrappedModel', 'current']);
        const update = (updater: InternalUpdater<any, Event>) => (
            (event: Event) => {
                return (
                    sendNext(
                        (mainModel: ContainerRecord<any, any>) => {
                            console.log('mainModel', mainModel);
                            mainModel.updateIn(
                                [...lookupChain, 'wrappedModel', 'previousModels'],
                                previousModels => [...previousModels, mainModel.getIn(['wrappedModel', 'current'])]
                            ).setIn(
                                [...lookupChain, 'wrappedModel', 'nextModels'], []
                            ).update(m => updater(m, event));
                            return mainModel.updateIn(
                                [...lookupChain, 'wrappedModel', 'current'],
                                m => updater(m, event)
                            );
                            //return updater(mainModel, event);
                        }
                    )
                );
            }
        );
        const nestedContainers = container.get('containers');
        const nestedContainerList = nestedContainers.keySeq().map(
            containerKey => ({
                key: containerKey,
                container: (
                    (
                        nestedContainers.get(containerKey)
                    ) || ({
                        get: (prop: string): any => {
                            switch(prop) {
                                case 'view': return (props: any) => h('div', ['loading...']);
                                case 'containers': return {
                                    keySeq: () => [] as any[]
                                };
                                case 'wrappedModel': return {
                                    getIn: () => null
                                };
                                default: return null;
                            }
                        }
                    }) as any
                )
            })
        );

        const resolvedNested = nestedContainerList.map(nested => {
            const {
                model: nestedModel,
                update: nestedUpdate,
                containers: nestedContainers
            } = resolve(nested.container, [...chain, nested.key]);

            const nestedView = nested.container.get('view');

            return {
                key: nested.key,
                resolvedContainer: (
                    (
                        (props: any) => nestedView({
                            model: nestedModel,
                            update: nestedUpdate,
                            containers: nestedContainers, 
                            props
                        })
                    ) || (
                        (props: any) => h('div', [`loading...`])
                    )
                )
            }
        });

        const containers = resolvedNested.reduce(
            (obj, nested) => {
                obj[nested.key] = (
                    (nested.resolvedContainer) || ((props: any) => h('div', [`loading...`]))
                );
                return obj;
            },
            {} as {[key: string]: any}
        );

        console.log('the thing', model);
        return { model: model.getIn(['current']), update, containers };
    }

    const view$ = containerModel$.map(
        model => view(resolve(model, []))
    );

    // emit view as just a function; not a stream
    // nested containers  should have wrappers that feed into the view function
    return {
        containerModel$,
        model$: containerModel$.map(model => model.getIn(['wrappedModel'])),
        DOM: view$,
        view
    };
}

/** 
 * a Component is nothing more than a function with two extra
 * properties added on.
 * 
 * A component is invoked much like a hyperscript helper function
 * with the addtional `model` parameter. To achieve the optional
 * parameters, some really weird duck typing. Check the source code
 * to see how it works but for the most part, it should work like you
 * expect it to.
 */
// export interface Component<Model> {
//     (
//         model?: any,
//         selector?: any,
//         properties?: any,
//         children?: any
//     ): VNode,
//     selector: string,
//     id: (model: Model) => string
// }

// export interface ComponentOptions<Model> {
//     selector: string
// ,   id: (model: Model) => string
// ,   view: (model: Model, children?: (VNode | string)[] | string, handler?: any) => VNode
// }

// /**
//  * Creates a new Component
//  */
// export function Component<Model>(
//     options: ComponentOptions<Model>
// ): Component<Model> {
//     const {selector, view, id} = options;

//     let component: any = function(a?: any, b?: any, c?: any, d?: any) {

//         let args = [a,b,c,d] as (Model | string | VNodeData | (VNode | string)[])[];

//         interface ComponentArgs<Model> {
//             model: Model,
//             selector: string,
//             data: VNodeData,
//             children: (VNode | string)[]
//         }

//         const {model, selector, data, children} = args.reduce((obj, arg) => {
//             // are you ready for some imperative code? me too
//             switch (typeof arg) {
//                 case 'object':
//                     if (Array.isArray(arg)) {
//                         obj.children = arg;
//                         break;
//                     }

//                     if (!obj.model && !obj.selector) {
//                         obj.model = arg as Model;
//                     } else {
//                         obj.data = arg;
//                     }
//                     break;
//                 case 'string':
//                     obj.selector = arg as string;
//                     break;
//                 case 'undefined': break;
//                 default: throw(
//                     `Expected a model, selector, data, or children `
//                     + `as arguments of the component '${options.selector}' `
//                     + `and we got ${JSON.stringify(arg)}. `
//                     + `You might need to '.toString()' it.`
//                 );
//             }
//             return obj;
//         }, {} as ComponentArgs<Model>);

//         const id = /*if*/ options.id && model ? (
//             options.id(model)
//         ) : ('');
//         function addSelector(node: VNode): VNode {
//             if (node.text) return node;
//             let vnode = node as VNode;
//             vnode.sel += `.${options.selector}.comp-${id}`;
//             if (vnode.children) {
//                 vnode.children.forEach((child: any) => addSelector(child));
//             }
//             return vnode;
//         }
//         const handler = (event: any) => console.log('from handler', event);
//         let vnode = addSelector(view(model, children, handler));
//         // typescript doesn't suppor this yet, but when it does,
//         // this line should replace the bottom bc it's prettier lol
//         // vnode.data = {...vnode.data, ...data};
//         vnode.data = Object.assign(vnode.data, data);
//         return vnode;
//     }
//     component.selector = selector;
//     component.id = options.id;
//     return component;
// }hjuhjjj


/*

const Todo = Component<>(
    (update) => h('div', )
);

const container = Container({
    view: ({model, update}) => h(
        Todo(model, update)
    )
})

 */