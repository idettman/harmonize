import component from './component';
import {OrderedMap} from 'immutable';

function toTitle(camel) {
    // TODO
    return camel;
}

export default function route({routes, view}) {

    const routeKeys = Object.keys(routes);

    const resolvedRoutes = (Object
        .keys(routes)
        .map(key => ({key, route: routes[key]}))
        .map(({key, route}) => {
            const component = /*if*/ typeof route === 'function' ? route : route.component;
            if (component === undefined) {throw `Route '${key}' was not configured correctly.`}
            const keyPath = (/*if*/ Array.isArray(route.keyPath)
                ? route.keyPath
                : [route.keyPath || key]
            );
            const label = route.label || toTitle(key);
            return {key, component, keyPath, label};
        })
        .reduce((obj, {key, component, keyPath, label}) => {
            obj[key] = {component, keyPath, label};
            return obj;
        }, {})
    );

    return component({
        model: OrderedMap({route: routeKeys[0]}),
        components: resolvedRoutes,
        view: ({model, props, update, remove, h: componentH}) => {

            // const anchorList = (Object
            //     .keys(resolvedRoutes)
            //     .map(route => ({route, routeOptions: routes[route]}))
            //     .map(({route, routeOptions}) => {
            //         const anchor = h('a', {
            //             on: {click: update({
            //                 map: event => {event.preventDefault(); return event;},
            //                 by: model => model.set('route', route);
            //             })},
            //             ch: 
            //         });
            //         return {route, anchor};
            //     })
            // );

            function h (selector, vNodeOptions) {
                if (selector.startsWith('route')) {

                    vNodeOptions = Object.assign(
                        vNodeOptions || {},
                        {pr: {routePath: [...(props.routePath || []), model.get('route')]}}
                    );

                    return componentH(
                        model.get('route'),
                        vNodeOptions
                    );
                }

                if (selector.startsWith('a-')) {
                    const routeAnchor = selector.substring('a-'.length);

                    vNodeOptions = Object.assign(
                        vNodeOptions || {},
                        {
                            on: {click: update({
                                map: event => {
                                    event.preventDefault();
                                    return event;
                                },
                                by: model => model.set('route', routeAnchor)
                            })},
                            pr: {href: [...(props.routePath || []), routeAnchor].join('/')},
                            ch: routeAnchor
                        }
                    );

                    return componentH('a', vNodeOptions);
                }

                return componentH(selector, vNodeOptions);
            }

            return view({model, update, remove, h});
        }
    });
}