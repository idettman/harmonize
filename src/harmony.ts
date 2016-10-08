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

export function harmonize(container: Container<any, any>) {
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
    undo: fromEvent(document, 'keyup').filter(event => event.key === 'u'),
    redo: fromEvent(document, 'keyup').filter(event => event.key === 'i'),
    view: ({model: count, update}) => h('div', [
        h('button', {on: {click: update(model => model - 1)}}, ['-']),
        h('h1', [`Count: ${count}`]),
        h('button', {on: {click: update(model => model + 1)}}, ['+'])
    ])
});

const container = Container({
    //containers: {nestedContainer},
    model: 'World!',
    undo: fromEvent(document, 'keyup').filter(event => event.key === 'z').map(e => {console.log('pressed z'); return e}),
    redo: fromEvent(document, 'keyup').filter(event => event.key === 'y'),
    view: ({model: word, update, containers: {nestedContainer}}) => h('div', [
        h('input', {
            on: {input: update(
                (model, event) => (event.target as HTMLInputElement).value
            )},
            props: {value: word}
        }),
        h('h1', [`hello, ${word}`]),
        //nestedContainer()
    ])
});

harmonize(container);