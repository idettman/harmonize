import container, {Container, InternalUpdater} from './container';
import {h, VNode} from './harmonize';
import {Record, Map} from 'immutable';
import fromEvent from 'xstream/extra/fromEvent';

export interface Page<Model> {
    name: string,
    displayName: string,
    container: Container<Model>
}

export interface RouterView {
    (options: {
        anchors: {[key: string]: VNode},
        anchorList: VNode[]
        currentPage: (props?: any) => VNode
    }): VNode
}

export interface Route {
    title?: string,
    path?: string,
    routes?: {[key: string]: (Route | Container<any>)}
    view?: RouterView,
    container?: Container<any>
}

export interface ResolvedRoute {
    title: string,
    path: string,
    container: Container<any>
}

export default ({routes, view}: {
    routes: {[key: string]: (Route | Container<any>)},
    view: RouterView
}) => {

    const toTitle = (key: string) => key;
    const toDashed = (key: string) => key;

    function resolve (
        key: string,
        routeOrContainer: (Route | Container<any>),
        pathStack: string[]
    ): ResolvedRoute {

        if ((routeOrContainer as Container<any>).componentState$) {
            const container = routeOrContainer as Container<any>;
            return {title: toTitle(key), path: toDashed(key), container};
        }

        if ((routeOrContainer as Route).container) {
            const {container, title, path} = (routeOrContainer as Route);
            return {
                title: title || toTitle(key),
                path: path || toDashed(key),
                container
            };
        }

        if ((routeOrContainer as Route).routes) {
            const {
                routes: nestedRoutes,
                title,
                path: unresolvedPath,
                view: routeView,
                container: containerPresent
            } = (routeOrContainer as Route);

            if (!view) throw `Property 'view' is required for routes with nested routes`;
            if (containerPresent) {
                throw `Property 'container' cannot be `
                + `present when 'routes' is present. `
                + `Use property 'view' instead`;
            }

            // resolve path
            const path = unresolvedPath || toDashed(key);
            console.log('path', [...pathStack, path]);

            const routeList = (Object
                .keys(nestedRoutes)
                .map(key => ({
                    key,
                    nestedRoute: resolve(
                        key,
                        nestedRoutes[key],
                        [...pathStack, path]
                    )
                }))
            );

            const nestedContainers = routeList.reduce(
                (obj, {key, nestedRoute}) => {
                    obj[key] = nestedRoute.container;
                    return obj;
                }, {} as {[key: string]: Container<any>}
            );

            const routeContainer = container({
                nestedContainers,
                initialState: routeList[0].key,
                // update: [{
                //     from:,
                //     by:
                // }],
                view: ({model: currentPage, containers, update}) => {

                    const anchorList = (routeList
                        .map(({key, nestedRoute}) => ({
                            key,
                            anchor: h('a', {
                                on: {click: update({
                                    map: (event) => {
                                        event.preventDefault();
                                        history.pushState(
                                            {},
                                            nestedRoute.title,
                                            [...pathStack, path, nestedRoute.path].join('/')
                                        );
                                        return event;
                                    },
                                    by: (currentPage => key)
                                })},
                                props: {href: [...pathStack, path, nestedRoute.path].join('/')}
                            }, [nestedRoute.title])
                        }))
                    );

                    return routeView({
                        anchors: anchorList.reduce(
                            (anchors, {key, anchor}) => {
                                anchors[key] = anchor;
                                return anchors;
                            },
                            {} as {[key: string]: VNode}
                        ),
                        anchorList: anchorList.map(a => a.anchor),
                        currentPage: (p?: any) => containers[currentPage](p)
                    })
                }
            });

            return {
                title: title || toTitle(title),
                path: path || toDashed(title),
                container: routeContainer
            };
        }

        throw `What did you mean by this route: '${JSON.stringify(routeOrContainer)}'?'`;
    };

    return resolve('', {routes, view}, []).container;
}