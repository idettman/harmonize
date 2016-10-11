import Container from './Container';
import harmonize, {h} from './';
import fromEvent from 'xstream/extra/fromEvent';
// import {undo, redo} from './';

declare function require(string: string): any;
require('normalize-css');
require('./styles.scss');

const nestedContainer = Container({
    initialState: 0,
    view: ({model: count, update}) => h('div', [
        h('h1', ['count: ' + count]),
        h('button', {on: update({by: (model) =>  model + 1})}, ['+1'])
    ])
});

const container = Container({
    nestedContainers: {nestedContainer},
    initialState: 'world',
    view: ({model: word, update}) => h('div.test', [
        h('input', {
            on: {input: update({
                map: (event) => (event.target as HTMLInputElement).value,
                by: (model, value) => value
            })},
            props: {value: word}
        }),
        h('h1', ['word: ' + word]),
        //nestedContainer()
    ])
});

//harmonize(container, '#will-i-pass');
