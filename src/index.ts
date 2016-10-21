import xs from 'xstream';
import {Container} from './Container';
export {default as Container} from './Container';

declare function require(path: string) : any;
const snabbdom = require('snabbdom');
export const h = require('snabbdom/h') as (
    selector: string,
    dataOrChildrenOrText?: any,
    childrenOrText?: any
) => VNode;

export interface VNode {
    sel: string,
    data: any,
    children: VNode[],
    text: string,
    elm: Element,
    key: string | number
}

const patch = snabbdom.init([
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners'),
]);

export default function harmonize(
    container: Container<any>,
    selector: string
) {
    let node = document.querySelector(selector) as VNode | Element;
    container.view$.addListener({
        next: (newNode) => {
            patch(node as any, newNode);
            node = newNode;
        },
        error: (error) => console.error(error),
        complete: () => console.log('complete')
    });
}