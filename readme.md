# Harmony UI
> the quality of forming a pleasing and consistent whole

Harmony UI is a frontend library that manages the state of your application using composable, push-based (reactive) containers and immutable, persistent data structures.

## Example

```ts
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

harmonize(container, '#will-i-pass');
```

This results in: ![example picture](https://github.com/ricokahler/harmony/blob/master/Capture.PNG).

This library is only in it's conceptual stages but we plan to make this into a full-fledge framework that will be more compelling than react/redux combo.

`Watch` this repository for updates.
