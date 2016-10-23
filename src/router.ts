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
        anchors: VNode[],
        currentPage: (props?: any) => VNode
    }): VNode
}

export default ({route, pages, view}: {route: string, pages: Page<any>[], view: RouterView}) => {

    const RouterRecord = Record({
        parentRoute: '',
        currentPage: pages.find(()=>true).name,
        pages
    });

    const nestedContainers = pages.reduce((obj, {name, container}) => {
        obj[name] = container;
        return obj;
    }, {} as any);

    return container({
        nestedContainers,
        initialState: new RouterRecord(),
        update: [{
            from: fromEvent(document, 'DOMContentLoaded'),
            by: model => {
                console.log('window.location.pathname', window.location.pathname);
                const path = window.location.pathname.split('/');
                const lastPath = path[path.length - 1];
                console.log('document loaded', lastPath);
                return model;
            }
        }, {
            from: fromEvent(window, 'popstate').map((event: PopStateEvent) => {
                event.preventDefault();
                event.state;
                return event;
            }),
            by: (model) => {
                console.log('TODO')
                return model;
            }
        }],
        view: ({
            props,
            model,
            update,
            containers
        }) => {

            const parentRoute = (props || {parentRoute: ''}).parentRoute || '';
            console.log('parentRoute', parentRoute);

            const pages = model.get('pages') as Page<any>[];

            const navigatingTo = (page: Page<any>) => (
                (model: Map<string, any>) => {
                    history.pushState(route, page.displayName, parentRoute + '/' + page.name);
                    return model.set('currentPage', page.name);
                }
            );

            const anchors = model.get('pages').map((page: Page<any>) => (
                h('a', {
                    on: {click: update({
                        map: (event) => {event.preventDefault(); return event;},
                        by: navigatingTo(page)
                    })},
                    props: {href: parentRoute + '/' + page.name}
                }, [
                    page.displayName
                ]))
            );

            const currentPage = (props: any) => (
                containers[model.get('currentPage')](Object.assign({}, props, {
                    parentRoute: parentRoute + '/' + model.get('currentPage')
                }))
            );

            return h('div', [
                view({anchors, currentPage}),
            ])
        }
    });
}