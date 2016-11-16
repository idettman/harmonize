import harmonize, {h, container} from '../';
import router from './router';
import xs from 'xstream';
import index from './routes';

const doubleNested = container({
    initialState: false,
    view: ({model: truth, update}) => h('div', [
        h('button', {
            on: {click: update({by: truth => !truth})}
        }, [/*if*/ truth ? 'yes': 'no'])
    ])
});

const nestedContainer = container({
    nestedContainers: {doubleNested},
    initialState: 0,
    view: ({
        containers: {doubleNested},
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
            ]),
            h('div', [
                h('p', ['the double nested container']),
                doubleNested()
            ])
        ]);
    }
});

const myContainer = container({
    //nestedContainers: {nestedContainer},
    initialState: {name: 'World', elapsedTime: 0},
    update: () => [{
        from: xs.periodic(1000),
        by: (model, time) => Object.assign({}, model, {elapsedTime: model.elapsedTime + 1})
    }],
    view: ({
        //containers: {nestedContainer},
        modules: {undo, redo},
        model: {name, elapsedTime},
        update
    }) => h('div', [
        h('div', [
            h('label', ['your name:']),
            h('input', {
                on: {input: update({
                    map: (event) => (event.target as HTMLInputElement).value,
                    by: (model, newName) => Object.assign({}, model, {name: newName})
                })},
                props: {value: name}
            })
        ]),
        h('h1', [`Hello, ${name}! ${elapsedTime}s have past.`]),
        h('div', [
            h('button', {on: {click: update(undo)}}, ['Undo']),
            h('button', {on: {click: update(redo)}}, ['Redo']),
        ]),
        h('div', [
            h('p', ['the nested container:']),
            //nestedContainer()
        ])
    ])
});



harmonize(index, '#example');
