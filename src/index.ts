import {Observable} from 'rxjs';
import xs from 'xstream';
import {VNode} from './Container';
declare function require(path: string) : any;

const snabbdom = require('snabbdom');
export const h = require('snabbdom/h') as (...args: any[]) => VNode;

const patch = snabbdom.init([
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners'),
]);

export default function harmonize(
    container: xs<VNode>,
    selector: string
) {
    console.log('container', container);
    (window as any).container = container;
    let node = document.querySelector(selector) as VNode | Element;
    container.addListener({
        next: (newNode) => {
            console.log('newNode', newNode);
            patch(node, newNode);
            node = newNode;
        },
        error: (error) => console.error(error),
        complete: () => console.log('complete')
    });
}