import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {Container} from './Component';
import {Record, List, Set, Map, Iterable} from 'immutable';

declare function require(path: string) : any;
declare type VNode = any;
declare type VNodeData = any;

const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const patch = snabbdom.init([
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners'),
]);

function harmonize(container: Container<any, any>) {
    container.DOM.fold((oldNode, newNode) => {
        patch(oldNode, newNode);
        return newNode;
    }, document.getElementById('example')).addListener({
        next: (vnode) => {},
        error: error => console.error(error),
        complete: () => {}
    });
}

const nestedContainer = Container({
    model: 0,
    view: ({model, update, props}) => h('div', [
        h('h1', ['Count: ' + model]),
        h('button', {
            on: {click: update(
                (model, event) => model + 1
            )}
        }, ['+1'])
    ])
});

const UndoRedoRecord = Record({
    undo: [] as any[],
    current: [{name: 'first todo', complete: false}],
    redo: [] as any[]
});

const TodoList = Container({
    containers: {nestedContainer},
    model: new UndoRedoRecord(),
    update: [{
        from$: fromEvent(document, 'keyup').map((event: KeyboardEvent) => event.key).filter(key => key === 'z'),
        by: (model, value) => model
            .set('current', model.get('undo')[model.get('undo').length - 1])
            .update('undo', undos => [...undos.slice(0, undos.length - 1)])
    }],
    view: ({model: undoRedo, update, containers: {nestedContainer}}) => {

        interface Todo {name: string, complete: boolean}
        const Todo = (todo: Todo) => h('li', [
            h('span', [todo.name]),
            h('input', {
                props: {type: 'checkbox', checked: todo.complete},
                on: {
                    click: update(
                        (undoRedo, event) => undoRedo.update(
                            'undo',
                            undos => [...undos, undoRedo.get('current')]
                        ).update(
                            'current',
                            todos => todos.map((t: any) => /*if*/ t.name === todo.name ? (
                                {name: t.name, complete: !t.complete}
                            ) : (t))
                        )
                    )
                },
            }),
            h('button', {
                on: {
                    click: update(
                        (undoRedo, event) => undoRedo.update(
                            'undo',
                            undos => [...undos, undoRedo.get('current')]
                        ).update(
                            'current',
                            todos => todos.filter((t: any) => t.name !== todo.name)
                        )
                    )
                }
            }, [
                'x'
            ])
        ]);

        const todos = undoRedo.get('current');

        return h('div.todo-list-container', [
            h('div.todo-list', [
                h('form', {
                    on: {submit: update(
                        (undoRedo, event) => undoRedo.update(
                            'undo',
                            undos => [...undos, undoRedo.get('current')]
                        ).update(
                            'current',
                            todos => {
                                event.preventDefault();
                                const name = (event.target as HTMLFormElement).querySelector('input').value;
                                return [...todos, {name, complete: false}];
                            }
                        )
                    )}
                }, [
                    h('input.todo-name', {props: {type: 'input', placeholder: 'Todo name'}}),
                    h('input.todo-submit', {props: {type: 'submit', value: 'Add'}})
                ]),
                h('div', [
                    h('h1.section', ['Todo']),
                    h('ul', todos.filter((todo: any) => !todo.complete).map((todo: any) => Todo(todo))),
                    h('h1.section', ['Completed']),            
                    h('ul', todos.filter((todo: any) => todo.complete).map((todo: any) => Todo(todo)))
                ])
            ]),
            nestedContainer()
        ]);
    }
});
harmonize(TodoList);
