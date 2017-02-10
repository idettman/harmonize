import xs from 'xstream';
import snabbdom from 'snabbdom';
import {OrderedMap} from 'immutable';
import moduleClass from 'snabbdom/modules/class';
import moduleProps from 'snabbdom/modules/props';
import moduleStyle  from 'snabbdom/modules/style';
import moduleEventListeners from 'snabbdom/modules/eventlisteners';
import comp from './component';
export const component = comp;

import rou from './router';
export const route = rou;

export default function harmonize({component, selector}) {
    const patch = snabbdom.init([moduleClass, moduleProps, moduleStyle, moduleEventListeners]);

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
