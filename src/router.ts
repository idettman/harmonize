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

interface Leaf {
    title: string,
    path: string,
    container: Container<any>
}

interface Branch {
    view: RouterView,
    path: string,
    routes: {[key: string]: Leaf | Branch},
}

export default ({routes, view}: {
    routes: {[key: string]: (Route | Container<any>)},
    view: RouterView
}) => {

    const toTitle = (key: string) => key;
    const toDashed = (key: string) => key;

    /**
     * Resolves a route from the router to be a branch with route list
     * or a leaf with a title, path, and container
     */
    function resolve (key: string, route: Route | Container<any>): Leaf | Branch {
        if ((route as Container<any>).componentState$) {
            const container = route as Container<any>
            const leaf: Leaf = {title: toTitle(key), path: toDashed(key), container};
            return leaf;
        }

        if ((route as Route).container) {
            const {container, title, path} = (route as Route);
            const leaf: Leaf = {
                title: title || toTitle(key),
                path: path || toDashed(key),
                container
            };
            return leaf;
        }

        if ((route as Route).routes) {
            const {view, routes, path: unresolvedPath} = route as Route;
            const path = unresolvedPath || toDashed(key);
            const branch: Branch = {
                view,
                path,
                routes: (Object
                    .keys(routes)
                    .map(key => ({
                        key,
                        resolvedRoute: resolve(key, routes[key])
                    }))
                    .reduce(
                        (obj, {key, resolvedRoute}) => {
                            obj[key] = resolvedRoute;
                            return obj;
                        },
                        {} as {[key: string]: Leaf | Branch}
                    )
                ),
            };
            return branch;
        }

        throw `What do you mean by this? ${JSON.stringify(route)}`
    };

    // resolve all the routes to either a leaf or branch
    const resolvedRoutes = (Object
        .keys(routes)
        .map(key => ({key, resolvedRoute: resolve(key, routes[key])}))
    );

    console.log(`resolved routes`, resolvedRoutes);

    /**
     * takes in a leaf or a branch and returns a list of all the contains inside
     */
    function flatMapRoute(path: string, route: Leaf | Branch): {
        path: string,
        container: Container<any>
    }[] {
        if ((route as Leaf).container) {
            return [{
                path: route.path,
                container: (route as Leaf).container
            }];
        }

        const routes = (route as Branch).routes;
        const nestedContainerList = (Object
            .keys(routes)
            .map(key => ({
                path: routes[key].path,
                containers: flatMapRoute(`${path}/${routes[key].path}`, routes[key])
            }))
            .reduce(
                (obj, {path, containers}) => {

                    
                    return [...obj, ...containers]
                },
                [] as {path: string, container: Container<any>}[]
            )
        );

        return nestedContainerList;
    }

    
    const nestedContainers = (resolvedRoutes
        .map(({key, resolvedRoute}) => ({
            key,
            routeList: flatMapRoute(key, resolvedRoute)
        }))
        .reduce(
            (obj, {key, routeList}) => {
                const reducedRoutes = routeList.reduce(
                    (obj, {path, container}) => {
                        obj[path] = container;
                        return obj;
                    },
                    {} as {[key: string]: Container<any>}
                );
                return Object.assign({}, obj, reducedRoutes);
            },
            {} as {[key: string]: Container<any>}
        )
    );
    console.log(`nestedContainers`, nestedContainers);
    

    const routerContainer = container ({
        nestedContainers,
        initialState: [] as string[],
        view: ({model: path, containers}) => {

            let placeHolder: any;

            function resolveView (route: Leaf | Branch, path: string[], key: string): (props?: any) => VNode {
                if (path.length == 1) {
                    return containers[key];
                }

                const currentPage = resolveView (route[path[0]], path.slice(1), ``);

                const branch = route as Branch;

                let anchorList: any;

                return (props?: any) => branch.view({
                    anchorList: placeHolder,
                    anchors: placeHolder,
                    currentPage: currentPage
                });
            }

            const views = resolvedRoutes.map(({key, resolvedRoute}) => resolveView(
                resolvedRoute,
                [],
                key
            ));

            return view({
                anchorList: placeHolder,
                anchors: placeHolder,
                currentPage: views[0]
            });
        }
    });

    return routerContainer;
}