import container, {Container, InternalUpdater} from './container';
import {h, VNode} from './harmonize';
import {Record, Map} from 'immutable';
import fromEvent from 'xstream/extra/fromEvent';
import xs from 'xstream';

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
    title: string,
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
            const {view, routes, path: unresolvedPath, title} = route as Route;
            const path = unresolvedPath || toDashed(key);
            const branch: Branch = {
                view,
                path,
                title: title || toTitle(path),
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

    const rootPath = `/`;
    const thisBranch: Branch = {
        view,
        path: rootPath,
        title: toTitle(rootPath),
        routes: (Object
            .keys(routes)
            .map(key => ({key, resolvedRoute: resolve(key, routes[key])}))
            .reduce((obj, {key, resolvedRoute}) => {
                obj[key] = resolvedRoute;
                return obj;
            }, {} as {[key: string]: Leaf | Branch})
        )
    };

    console.log(`this branch`, thisBranch);

    /**
     * takes in a leaf or a branch and returns a list of all the contains inside
     */
    function flatMapRoute(path: string, route: Leaf | Branch): {
        path: string,
        container: Container<any>
    }[] {
        if ((route as Leaf).container) {
            return [{
                path: `${path}`,
                container: (route as Leaf).container
            }];
        }

        const routes = (route as Branch).routes;
        const nestedContainerList = (Object
            .keys (routes)
            .map (key => ({
                containers: flatMapRoute (
                    `${path}/${routes[key].path}`,
                    routes[key]
                )
            }))
            .reduce (
                (obj, {containers}) => {
                    return [...obj, ...containers];
                },
                [] as {path: string, container: Container<any>}[]
            )
        );

        return nestedContainerList;
    }

    const nestedContainers = flatMapRoute(``, thisBranch).reduce(
        (obj, {path, container}) => {
            obj[path] = container;
            return obj;
        },
        {} as {[key: string]: Container<any>}
    );

    console.log (`flatMapRoute`, nestedContainers);
    

    const routerContainer = container ({
        nestedContainers,
        initialState: window.location.pathname.split(`/`).slice(1),
        update: ({undo, redo}) => [{
            from: fromEvent(window, `popstate`),
            byInternal: (path) => {
                console.log(`updating from popstate event`);
                return undo.byInternal(path);
            }
        }],
        view: ({model: path, containers, props, update}) => {
            console.log(`path`, path);
            let placeHolder: any;

            function resolveView (
                route: Leaf | Branch,
                path: string[],
                key: string
            ): (props?: any) => VNode {
                if (containers[key]) {
                    return containers[key];
                }

                const branch = route as Branch;
                const firstRoute = branch.routes[Object.keys(branch.routes)[0]];
                const nextRoute = branch.routes[path[0]] || firstRoute;

                const currentPage = resolveView (
                    nextRoute,
                    path.slice(1),
                    `${key}/${nextRoute.path}`
                );

                const anchors = (Object
                    .keys(branch.routes)
                    .map(branchKey => ({
                        branchKey,
                        route: branch.routes[branchKey]
                    }))
                    .map(({branchKey, route}) => ({
                        href: `${key}/${branchKey}`,
                        title: (route as Leaf).title || route.path
                    }))
                    .map(({href, title}) => h('a', {
                        props: {href},
                        on: {click: update({
                            by: (model, event) => {
                                event.preventDefault();
                                return href.split(`/`).slice(1);
                            }
                        })}
                    }, [title]))
                );

                let anchorList: any;

                return (props?: any) => branch.view({
                    anchorList: anchors,
                    anchors: placeHolder,
                    currentPage
                });
            }

            const resolvedView = resolveView(thisBranch, path, ``);

            history.replaceState([...path], ``, [...path].join(`/`));

            return resolvedView(props);
        }
    });

    // routerContainer.state$.addListener({
    //     next: path => history.pushState([...path], ``, [...path].join(`/`)),
    //     error: error => console.log(error),
    //     complete: () => console.log(`complete`)
    // });

    return routerContainer;
}