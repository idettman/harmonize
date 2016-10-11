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
    view: ({model: count, update, containers: {doubleNested}}) => h('div', [
        h('h1', ['count: ' + count]),
        h('button', ['+1']),
        doubleNested()
    ])
});

const container = Container({
    nestedContainers: {nestedContainer},
    initialState: 'world',
    view: ({model: word, update, containers: {nestedContainer}}) => {
        console.log('nestedContainer', (nestedContainer || 'nothing').toString());
        return h('div.test', [
            h('input', {
                props: {value: word}
            }),
            h('h1', ['word: ' + word]),
            nestedContainer('f')
        ]);
    }
});

harmonize(container, '#will-i-pass');
