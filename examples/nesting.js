import harmonize, {h} from './';
import component from './component';
import {fromJS, Record, OrderedMap} from 'immutable';
const {random} = Math;
const toValue = event => event.target.value;

const fourth = component({
    view: ({model, update}) => {
        return h('div', [
            h('hr'),
            h('span', ['fourth']),
            h('h1', [`Hello ${model}!`]),
            h('input', {
                props: {value: model},
                on: {input: update({
                    map: event => event.target.value,
                    by: (state, value) => value    
                })}
            }),
            h('hr')
        ]);
    }
});

const third = component({
    components: {
        fourth: {
            component: fourth,
            update: (source, model) => source.set('nestedNestedModel', model)
        }
    },
    view: ({model, update, components: {fourth}}) => {
        return h('div', [
            h('hr'),
            h('span', ['third']),
            fourth(model.get('nestedNestedModel')),
            h('hr')
        ])
    }
})

const second = component({
    components: {
        third: {
            component: third,
            update: (source, model) => source.set('nestedModel', model)
        }
    },
    view: ({model, update, components: {third}}) => {
        return h('div', [
            h('hr'),
            h('span', ['second']),
            third(model.get('nestedModel')),
            h('hr')
        ])
    }
})

const first = component({
    components: {
        second: {
            component: second,
            update: (source, model) => source.set('innerModel', model)
        }
    },
    view: ({model, update, components: {second}}) => {
        console.log(model.toJS())
        return h('div', [
            h('hr'),
            h('span', ['first']),
            second(model.get('innerModel')),
            h('hr')
        ]);
    }
});

harmonize({
    model: fromJS({
        innerModel: {nestedModel: {nestedNestedModel: 'world'}}
    }),
    component: first,
    selector: '#example'
});
