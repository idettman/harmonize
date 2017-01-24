import xs from 'xstream';
const snabbdom = require('snabbdom');
export const h = require('snabbdom/h');
import {assignKeys} from './util';
import {OrderedMap} from 'immutable';

export default function harmonize({component, selector}) {
    const patch = snabbdom.init([
        require('snabbdom/modules/class'),
        require('snabbdom/modules/props'),
        require('snabbdom/modules/style'),
        require('snabbdom/modules/eventlisteners')
    ]);

    const event$ = xs.never();
    const sendNext = event$.shamefullySendNext.bind(event$);

    const state$ = event$.fold(
        (state, update) => update(state),
        OrderedMap()
    );

    const view$ = state$.map(model => component({
        model,
        sendNext,
        componentPath: [],
        update: updaterOptions => {
            const update = (/*if*/ typeof updaterOptions === 'function'
                ? updaterOptions
                : updaterOptions.by
            );
            const map = updaterOptions.map || (x => x);
            return event => sendNext(
                model => update(model, map(event))
            );
        },
    }));

    let node = document.querySelector(selector);
    view$.addListener({
        next: newNode => {
            patch(node, newNode);
            node = newNode;
        },
        error: console.error,
        complete: () => console.log('complete')
    });
}
