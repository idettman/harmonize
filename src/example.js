import harmonize, {h} from './';
import component from './component';
import history from './history';
import route from './router';
import {fromJS, Record, OrderedMap, Map} from 'immutable';
const {random} = Math;
const toValue = event => event.target.value;
import 'bulma/css/bulma.css';

const todo = component({
    view: ({model: todo, update, remove, h}) => {
        return h('li', {
            ch: (/*if*/ todo.editing
                ? [h('form', {
                    on: {submit: update({
                        map: event => {
                            event.preventDefault();
                            return event.target.querySelector('.todo-name-field').value;
                        },
                        by: (todo, name) => todo.set('name', name).set('editing', false)
                    })},
                    ch: [h('input.todo-name-field', {
                        pr: {type: 'text', value: todo.name},
                        ho: {insert: vnode => vnode.elm.focus()}
                    }),
                    h('input', {
                        pr: {type: 'submit', value: 'OK'}
                    }),
                    h('button', {
                        pr: {type: 'button'},
                        on: {click: remove()},
                        ch: 'x'
                    })]
                })]
                : [h('div', {
                    ch: [h('span', {
                        on: {click: update(todo => todo.set('editing', true))},
                        ch: todo.name
                    }),
                    h('input', {
                        pr: {type: 'checkbox', checked: todo.checked},
                        on: {click: update(todo => todo.update('checked', checked => !checked))}
                    })]
                })]
            )
        });
    }
});

const todoList = component({
    components: {
        todo: {
            component: todo,
            id: todo => todo.id,
            update: id => ['todos', id],
            remove: id => ['todos', id]
        }
    },
    view: ({model, update, h}) => {
        return h('div', {
            ch: [h('form', {
                on: {submit: update({
                    map: event => {
                        event.preventDefault();
                        return event.target.querySelector('.new-todo').value;
                    },
                    by: (model, name) => {
                        const id = random();
                        return model.setIn(['todos', id], Map({id, name, editing: false, checked: false}));
                    }
                })},
                ch: [h('label', {
                    ch: ['new todo: ',
                    h('input.new-todo', {
                        pr: {type: 'text'}
                    })]
                }),
                h('input', {
                    pr: {type: 'submit', value: 'Create TODO'}
                })]
            }),
            h('hr'),
            h('ul', {
                ch: model.get('todos').valueSeq().toArray().map(todo => h('todo', {
                    mo: todo
                }))
            })]
        });
    }
});

harmonize({
    model: OrderedMap({todos: OrderedMap()}),
    component: todoList,
    selector: '#example'
});
