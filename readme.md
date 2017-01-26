# Harmony MV
> the quality of forming a pleasing and consistent whole

Harmony MV is a frontend framework that manages the state of your application using composable, push-based (reactive) components and immutable persistent data structures.

If you're familiar with React and Redux, the goal of this framework is follow a very similar architecture expect that it removes the indirection that redux enforces.

That is:

**In Redux, you dispatch `string`s that represent actions**

```jsx
const store = createStore(counter)
const rootEl = document.getElementById('root')

const render = () => ReactDOM.render(
  <Counter
    value={store.getState()}
    onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
    onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
  />,
  rootEl
)

render()
store.subscribe(render)
```

Then in a *separate file* you `switch` on that `string` to get a function.

```js
export default (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    default:
      return state
  }
}
```

This introduces A LOT of indirection!

**In Harmony, you "dispatch" `function`s that directly update the state.**

(And in the case where you want to dispatch an action more than once, just save the function into a variable)

```js
const counter = component({
    view: ({model: count, update, h}) => {
        return h('div', {
            ch: [h('button', {
                on: {click: count => count - 1},
                ch: '-'
            }),
            h('h1', {ch: count}),
            h('button', {
                on: {click: count => count + 1},
                ch: '+'
            })]
        })
    }
})

harmonize({
    model: 0,
    component: counter,
    selector: '#example'
});
```

That's what this framework aims to do--have the same benefits by using the same unidirectional data-flow but remove all the indirection.

This framework is only in it's conceptual stages. Check back soon.