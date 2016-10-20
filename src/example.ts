import Container from './Container';
import harmonize, {h} from './';

const doubleNested = Container({
    initialState: false,
    view: ({model: truth, update}) => h('div', ['is: ' + truth])
});

const nestedContainer = Container({
    initialState: 0,
    view: ({
        modules: {undo, redo},
        update,
        model: count
    }) => {
        const add = (x: number) => h('button', {
            on: {click: update({by: (count) => count + x})}
        }, [x]);

        return h('div', [
            h('h1', [`count: ${count}`]),
            h('div', [add(-1), add(-2), add(2), add(1)]),
            h('div', [
                h('button', {on: {click: update(undo)}}, ['Undo']),
                h('button', {on: {click: update(redo)}}, ['Redo'])
            ])
        ]);
    }
});

const container = Container({
    nestedContainers: {nestedContainer},
    initialState: 'World',
    view: ({
        containers: {nestedContainer},
        modules: {undo, redo},
        model: name,
        update
    }) => h('div', [
        h('div', [
            h('label', ['your name:']),
            h('input', {
                on: {input: update({
                    map: (event) => (event.target as HTMLInputElement).value,
                    by: (name, targetValue) => targetValue
                })},
                props: {value: name}
            })
        ]),
        h('h1', [`Hello, ${name}!`]),
        h('div', [
            h('button', {on: {click: update(undo)}}, ['Undo']),
            h('button', {on: {click: update(redo)}}, ['Redo']),
        ]),
        h('div', [
            h('p', ['the nested container:']),
            nestedContainer()
        ])
    ])
});

harmonize(container, '#example');
