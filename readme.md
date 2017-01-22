# Harmony MV
> the quality of forming a pleasing and consistent whole

Harmony MV is a frontend framework that manages the state of your application using composable, push-based (reactive) components and immutable persistent data structures.

If you're familiar with React and Redux, the goal of this framework is follow a very similar architecture expect that it removes the indirection that redux enforces.

That is:

In Redux, you dispatch `string`s that represent actions

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

This introduces A LOT of indirection! Why can't you just map the event to a function that will change the state?

That's what this framework aims to do--have the same benefits by using the same unidirectional data-flow but remove all the indirection. The goal is to create a very *simple* and very *usable* api.

This framework is only in it's conceptual stages. Check back soon.