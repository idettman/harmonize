import component from './component';

import {h} from './';

function toTitle(camelCase) {
    // TODO
    return camelCase;
}


export default function route({
    routes,
    view
}) {
    console.log('routes', routes);

    //const components = Object.keys(routes);

    return compxonent({
        components: routes,
        view: ({model, update, props, components}) => {

            const route = model.get('route') || Object.keys(components)[0];
            console.log('route', route);
            console.log('components', components);
            const rawCurrentPage = routes[route];

            const current = (
                (/*if*/ rawCurrentPage.component === undefined
                    && typeof rawCurrentPage === 'function'
                )
                ? ({component: rawCurrentPage, label: route})
                : rawCurrentPage
            );

            const subModel = /*if*/ current.get ? current.get(model) : model;

            const componentView = components[route];

            console.log(typeof componentView);

            const currentPage = componentView({
                model: subModel,
                props: {routeChain: [...(props && props.routeChain || []), route]}
            });

            const anchorList = (Object
                .keys(components)
                .map(key => ({key, routeOptions: components[key]}))
                .map(({key, routeOptions}) => ({
                    key,
                    label: /*routeOptions.label || */toTitle(key)
                }))
                .map(({label, key}) => ({
                    key,
                    anchor: h('a', {
                        on: {click: update({
                            // TODO create history.pushState side effect
                            map: event => {
                                event.preventDefault();
                                return event;
                            },
                            by: model => model.set('route', key)
                        })},
                        props: {href: (props && props.routeChain || []).join('/') + '/' + key}
                    }, [label])
                }))
            );

            const anchor = anchorList.reduce((obj, {anchor, key}) => {
                obj[key] = anchor;
                return obj;
            }, {});

            const anchors = anchorList.map(({anchor, key}) => anchor);

            return view({model, anchor, anchors, currentPage});
        }
    });
}

/*

const index = route({
    label: '',
    routes: {
        home, // the component only
        home: {component: home}, // the component only with an object
        about: { // with model mapping
            label: 'About',
            get: (source) => source.get('id')
            component: component({}),
            //id: model => model.get('id'),
            //update: (source, model) => source.set('key', model),
            //remove: (source, id) => source.delete(id),
        },
        // or a route. a route is just a component so the above applies
        nestedRoute: route({
            routes: 
        }),
        // including a route with model mapping
        nestedRoute: {
            component: route({}),
            update: (source, model) =>
        }
    },
    view: ({model, anchors, currentPage}) => h('div', [
        currentPage
    ])
});

harmonize({
    model: fromJS({
        route,
        home: {
            route: ,

        },
        about,
    }),
    component: index,
    selector: '#example'
});

*/