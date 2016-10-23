import harmonize, {h, container} from '../';
import router from './router';
import xs from 'xstream';

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
    update: [{
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

const home0 = container({
    initialState: 'home 0',
    view: ({model: title}) => h('div', [title])
});

const home1 = container({
    initialState: 'home 1',
    view: ({model: title}) => h('div', [title])
});

const home = router({
    route: 'home',
    pages: [{
        name: 'home0',
        displayName: 'Home 0',
        container: home0
    }, {
        name: 'home1',
        displayName: 'Home 1',
        container: home1
    }],
    view: ({anchors, currentPage}) => h('div', [
        h('h1', ['Home page']),
        h('div', anchors),
        h('div', [
            currentPage()
        ])
    ])
});

const about = container({
    initialState: 'about page',
    view: ({model: title}) => h('h1', [title])
});

const main = router({
    route: '',
    pages: [{
        name: 'myContainer',
        displayName: 'My Container',
        container: myContainer
    }, {
        name: 'second',
        displayName: 'Second',
        container: nestedContainer
    }, {
        name: 'home',
        displayName: 'Home',
        container: home
    }, {
        name: 'about',
        displayName: 'About',
        container: about
    }],
    view: ({
        anchors: [myContainerLink, nestedLink, home, about],
        //forward
        currentPage
    }) => {
        return h('div', [
            h('h1', ['router links: ']),
            /*
            h('div', {on: {click: forward}})
            */
            h('span', [myContainerLink, nestedLink, home, about]),
            h('div', [
                currentPage()
            ])
        ]);
    }
});

harmonize(main, '#example');
