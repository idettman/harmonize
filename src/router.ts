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

    const rootPath = `/`;
    const thisBranch: Branch = {
        view,
        path: rootPath,
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
        initialState: [] as string[],
        view: ({model: path, containers, props, update}) => {

            let placeHolder: any;

            function resolveView (
                route: Leaf | Branch,
                path: string[],
                key: string
            ): (props?: any) => VNode {
                console.log (`path`, path);
                if ((route as Leaf).container) {
                    console.log(`leaf`, containers[key]);
                    console.log(`containers`, containers);
                    return containers[`/${key}`];
                }

                const branch = route as Branch;
                console.log(`branch`, branch);
                const firstRoute = branch.routes[Object.keys(branch.routes)[0]];
                const currentPage = resolveView (
                    branch.routes[path[0]] || firstRoute,
                    path.slice(1),
                    /*if*/ key ? `${key}/${
                        /*if*/ path[0] ? path[0] : firstRoute.path
                    }` : firstRoute.path
                );

                const anchors = (Object
                    .keys(branch.routes)
                    .map(branchKey => ({
                        branchKey,
                        route: branch.routes[branchKey]
                    }))
                    .map(({branchKey, route}) => ({
                        href: key ? `${key}/${branchKey}`: branchKey,
                        title: (route as Leaf).title || route.path
                    }))
                    .map(({href, title}) => h('a', {
                        props: {href},
                        on: {click: update({
                            by: (model, event) => {
                                console.log(`clicked`, event);
                                event.preventDefault();
                                console.log(`currentModel`, model);
                                console.log(`href`, href);
                                console.log(`new model`, href.split(`/`));
                                return href.split(`/`);
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
            console.log(`resolvedView`, resolvedView());

            return resolvedView(props);
        }
    });

    routerContainer.state$.addListener({
        next: path => history.pushState(0, ``, path.join(`/`)),
        error: error => console.log(error),
        complete: () => console.log(`complete`)
    });

    return routerContainer;
}