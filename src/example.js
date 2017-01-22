import harmonize, {h} from './';
import component from './component';
import history from './history';
import route from './router';
import {fromJS, Record, OrderedMap, Map} from 'immutable';
const {random} = Math;
const toValue = event => event.target.value;
import 'bulma/css/bulma.css';

const todo = component({
    view: ({model: todo, update, remove}) => {

        return h('li', (/*if*/ todo.editing
            ? ([
                h('form', {
                    on: {submit: update({
                        map: event => {
                            event.preventDefault();
                            return event.target.querySelector('.todo-name-field').value;
                        },
                        by: (todo, name) => todo.set('name', name).set('editing', false)
                    })}
                }, [
                    h('input.todo-name-field', {
                        props: {type: 'text', value: todo.name},
                        hook: {insert: vnode => vnode.elm.focus()}
                    }),
                    h('input', {
                        props: {type: 'submit', value: 'OK'}
                    }),
                    h('button', {
                        props: {type: 'button'},
                        on: {click: remove()}
                    }, ['x'])
                ])
            ])
            : ([
                h('div', [
                    h('span', {
                        on: {click: update(todo => todo.set('editing', true))}
                    }, [todo.name]),
                    h('input', {
                        props: {type: 'checkbox', checked: todo.checked},
                        on: {click: update(todo => todo.update('checked', checked => !checked))}
                    })
                ])
            ])
        ));
    }
});

const Todo = Record({
    id: undefined,
    name: '',
    checked: false,
    editing: false,
})

const todoList = component({
    components: {todo: {
        model: Map()
        component: todo,
        id: todo => todo.id,
        get: (source) => source.get('todos'),
        update: (source, model, id) => source.setIn(['todos', id], model),
        remove: (source, id) => source.deleteIn(['todos', id])
    }},
    view: ({model, update, components: {todo}}) => {
        return h('div', [
            h('form', {
                on: {submit: update({
                    map: event => {
                        event.preventDefault();
                        return event.target.querySelector('.new-todo').value;
                    },
                    by: (model, name) => {
                        const id = random();
                        return model.setIn(['todos', id], new Todo({id, name}));
                    }
                })}
            }, [
                h('label', [
                    'new todo: ',
                    h('input.new-todo', {
                        props: {type: 'text'}
                    })
                ]),
                h('input', {
                    props: {type: 'submit', value: 'Create TODO'}
                })
            ]),
            h('hr'),
            h('ul', model.todos.valueSeq().toArray().map(todo))
        ])
    }
});

const TodoList = Record({todos: OrderedMap()})

const myComponent = component({
    view: ({model, update, children, h}) => {
        {
            ['div#mything.className']: {
                props: {type: 'input', value: model.get('name')},
                click: update({}),
                hover: update({}),
                submit: update({})
                child: {
                    ['ul#myul.somelist']: {
                        child: {
                            
                        }
                    }
                }
            }
        };

        h('div', {}, [])
        h('h1.myheading', {ch: 'thing'})
        

        return h.div({
            s: '',
            p: {value},
            o: {click: update({
                map: event => event.target.value,
                by: (state, value) => state.set('')
            })},
            c: [
                h({s: 'div.thing',
                    p: 
                }),
                h.nav({}),
                h.todo({
                    s: ''
                    m: model.get('todo'),
                    p: {},
                    c: []
                }),
                ...children
            ]
        });
    }
});

/*

const index = router({
    routes: {
        home: component({

        })
    }
})

// subroutes can be routes that can spawn into different more subroutes or just plain ole components



const index = route({
    label: 'Home',
    routes: {
        nestedRoute: route({}),
        about: {
            label: 'About'
            component({})
        },
        contact: component({})
    },
    view: ({anchorList, anchor, currentPage}) => {

    }
});

harmonize({
    model: fromJS({route: [], clicks: 0}),
    component: index,
    selector: '#example'
});


// new vnode api
h('div.className', {
    on: {click: update({
        map: event => event.target.value,
        by: (state, value) => state.update('key', x => x + value)
    })},
    pr: {type: 'text', value: model.get('name')},
    ch: [h('todo.mytodo', {
        on: {edit: update({
            by: (model, event: {todo}) => model.update('todos', asList(todos => (todos
                .map(t => t.set('editing', false))
            )))
        })},
        st: {},
        cl: {},
        pr: {},
        ch: [

        ]
    }), h('todo.mytodo', {
        on: {edit: update({
            by: (model, event: {todo}) => model.update('todos', asList(todos => (todos
                .map(t => t.set('editing', false))
            )))
        })},
        st: {},
        cl: {},
        pr: {},
        ch: [

        ]
    })]
});

*/

const nested0 = component({
    view: () => h('h1', ['Nested 0'])
});

const nested1 = component({
    view: () => h('h1', ['Nested 1'])
});

const home = route({
    routes: {
        nested0: {
            component: nested0
        },
        nested1: {
            component: nested1
        }
    },
    view: ({model, anchors, currentPage}) => {
        return h('div', [
            h('h1', ['The Home Component']),
            h('ul', anchors),
            currentPage
        ]);
    }
})

const index = route({
    routes: {
        home: {
            component: home
        },
        todoList: {
            component: todoList,
            get: source => source.get('todoList'),
            update: (source, model) => source.set('todoList', model)
        },
    },
    view: ({model, anchors, currentPage}) => {
        console.log(model.toJS());
        return h('div', [
            h('ul', anchors),
            currentPage
        ]);
    }
});

harmonize({
    component: index,
    selector: '#example'
});
