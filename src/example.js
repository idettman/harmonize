import harmonize, {h} from './';
import component from './component';
import history from './history';
import {fromJS, Record, OrderedMap} from 'immutable';
const {random} = Math;
const toValue = event => event.target.value;

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
        component: todo,
        id: todo => todo.id,
        update: (source, model, id) => source.setIn(['todos', id], model),
        remove: (source, id) => source.deleteIn(['todos', id])
    }},
    view: ({model, update, components: {todo}}) => {
        console.log('render');
        return h('div', [
            h('button', {
                on: {click: update(model => model.undo())}
            }, ['Undo']),
            h('button', {
                on: {click: update(model => model.redo())}
            }, ['Redo']),
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

harmonize({
    model: history(new TodoList()),
    component: todoList,
    selector: '#example'
});
