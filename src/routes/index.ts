import {h} from '../harmonize';
import container from '../container';
import router, {Route} from '../router';

const home0 = container({
    initialState: 'This is home 0',
    view: ({model: title}) => h('h1', [title])
});

const home1 = container({
    initialState: 'This is home 1',
    view: ({model: title}) => h('h1', [title])
});

const nestedNested = container({
    initialState: 'nestednested',
    view: ({model: title}) => h('h1', [title])
});


const thingy = container({
    initialState: 'thingy!',
    view: ({model: title}) => h('h1', [title])
});

const home: Route = ({
    title: 'Home Test',
    view: ({anchorList, currentPage}) => h('div', [
        h('ul', anchorList.map(a => h('li', [a]))),
        currentPage()
    ]),
    routes: {
        home0: {
            title: 'Home 0',
            view: ({anchorList, currentPage}) => h('div', [
                h('ul', anchorList.map(a => h('li', [a]))),
                currentPage()
            ]),
            routes: {
                nestedNested, thingy
            }
        } as Route,
        home1
    }
});

const about = container({
    initialState: 'this is the about page',
    view: ({model: title}) => h('h1', [title])
});

export default router({
    routes: {home, about},
    view: ({
        anchorList,
        currentPage
    }) => h('div', [
        h('ul', anchorList.map(a => h('li', [a]))),
        currentPage()
    ])
});