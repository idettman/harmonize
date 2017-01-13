import xs from 'xstream';
import {Record, fromJS} from 'immutable';

export default function container ({model, view, update}) {

    const externalUpdate$s = (update || []).map(({on, by: update}) => on.map(value => (
        state => update(state, /*with*/value)
    )));

    const internalUpdates$ = xs.never();
    const sendNext = internalUpdates$.shamefullySendNext.bind(internalUpdates$);

    const state$ = (xs
        .merge(...externalUpdate$s, internalUpdates$)
        .fold((state, update) => update(state), model)
    );

    const internalUpdate = updaterOptions => {
        const update = /*if*/ typeof updaterOptions === 'function' ? updaterOptions : updaterOptions.by;
        const map = updaterOptions.map || (x => x);
        return event => sendNext(
            state => update(state, /*with*/ map(event))
        );
    }

    const view$ = state$.map(state => view({state, update: internalUpdate}));

    return {state$, view$, view};
}

/*

const MyType = Record({
    a: 'default value',
    b: 'deafult value'
});

const makeTodo = ({name}) container({
    model: new TodoModel({
        name,
        id: guid()
    }),
    view: ({
        update,
        state
    }) => (
        if state.editing ? (
            h('input', {
                props: {value: state.name},
                on: {input: update({
                    map: toValue,
                    by: (state, value) => state.set('name', value)
                })}
            }),
            h('input', {
                props: {type: 'checkbox', value: state.checked},
                on: {click: update({
                    by: state => state.update('checked', x => !x)
                })}
            }),
            h('button', {
                on: {click: update({
                    by: (state) => state.set('deleted', true)
                })}
            }, ['delete'])
        ) : (

        )
    )
});

// need something to add and remove containers dynamically
// i should be able to make a todo component$
// maybe a collection sort of thing like backbone would be a good idea
let todoList;
todoList = container({
    model: new TodoListModel(),
    containers: 

});

const myContainer = container({
    model: new MyType(),
    containers: {nestedContainer, anotherNestedContainer},
    update: [{
        on: otherContainer.state$.map(otherContainerState => ),
        by: (state, value) => state.update('propName', x => x + value)
    }, {
        on: periodic(1000),
        by: (model, time) => model.update('time', x => x + 1)
    }],
    view: ({
        props,
        update,
        containers: {nestedContainer, anotherNestedContainer}
        state
    }) => h('div', [
        h('h1', [model.prop])
        h('input', {
            on: {input: update({
                map: toValue,
                by: (state, value) => state.set('prop', value)
            }))}
        })
    ])
})

 */