import {Container} from './Component';
export const add = (model, event) => model + 1;

export const container = Container({
    //containers: {nestedContainer},
    model: 0,
    update: [{
        from$: fromEvent(document, 'click'),
        by: (count, event) => count + 1
    }],
    view: ({model: count, update, containers: {nestedContainer}}) => h('div', {
        on: {click: update(add)}
    }, [
        ('count: ' + count),
        nestedContainer('feuiwoj')
    ])
});

    //do updating stuff