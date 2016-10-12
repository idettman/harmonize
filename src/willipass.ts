import Container from './Container';
import harmonize, {h} from './';
import fromEvent from 'xstream/extra/fromEvent';
// import {undo, redo} from './';

declare function require(string: string): any;
require('normalize-css');
require('./styles.scss');

const doubleNested = Container({
    initialState: false,
    view: ({model: truth, update}) => h('div', ['is: ' + truth])
});

const nestedContainer = Container({
    nestedContainers: {doubleNested},
    initialState: 0,
    view: ({
        containers: {doubleNested},
        modules: {undo, redo},
        update,
        model: count,
    }) => h('div', [
        h('h1', ['count: ' + count]),
        h('button', {
            on: {click: update({by: (model) => model + 1})}
        }, ['+1']),
        h('button', {
            on: {click: update(undo)}
        }, ['undo']),
        doubleNested()
    ])
});

const container = Container({
    nestedContainers: {nestedContainer},
    initialState: 'world',
    view: ({model: word, update, containers: {nestedContainer}, modules: {undo,redo}}) => {
        return h('div.test', [
            h('input', {
                on: {input: update({
                    map: event => (event.target as HTMLInputElement).value,
                    by: (word, value) => value
                })},
                props: {value: word}
            }),
            h('h1', ['word: ' + word]),
            h('div', [
                h('button', {on: {click: update(undo)}}, ['undo']),
                h('button', {on: {click: update(redo)}}, ['redo'])
                
            ]),
            nestedContainer('f')
        ]);
    }
});

harmonize(container, '#will-i-pass');
