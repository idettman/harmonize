import Container from './Container';
import harmonize, {h} from './';
import fromEvent from 'xstream/extra/fromEvent';



const container = Container({
    initialState: 'world',
    undo: fromEvent(document, 'keyup').filter(event => event.key === 'z'),
    redo: fromEvent(document, 'keyup').filter(event => event.key === 'y'),
    view: ({model: word, update}) => h('div', [
        h('input', {
            on: {input: update({
                map: (event) => (event.target as HTMLInputElement).value,
                by: (model, value) => value
            })},
            props: {value: word}
        }),
        h('h1', ['word: ' + word])
    ])
});

harmonize(container, '#example');
