# Harmony UI
> the quality of forming a pleasing and consistent whole

Harmony UI is a frontend framework that manages the state of your application using composable, push-based (reactive) containers and immutable persistent data structures.

This framework is only in it's conceptual stages but we plan to make this into a full-fledge framework that will be more compelling than react/redux combo.

Due to the current conceptual state of the framework, the following readme only explains the why and what of this framework with a bit of background. Most of this will be moved to the wiki as time progresses. `Watch` this repository for updates, there's a lot more to come.

## What is Harmony?

> Harmony UI is a frontend framework that manages the state of your application using composable, push-based (reactive) containers and immutable persistent data structures.

### Okay cool, but what *is* it? Is that like an angular/react type of thing?

Yes, exactly! I would throw harmony into my 'frontend frameworks' tool basket because it *enforces* an opinionated way to build your application, and in particular, it enforces a way to manage the state of your application.

Harmony is most comparable to the react ecosystem because the react ecosystem offers opinionated ways to render to the DOM and manage state. This library *isn't* comparable to, say backbone, because backbone doesn't enforce an opinionated way to build applications, it mostly just promotes organization.

### Framework, Library, Ecosystem? What's the difference here?

The world of web development is moving at a too rapid pace for really anyone to keep up so I apologize in advance if any of this sounds silly/pointless.

A library is simply a set of prebuilt tools and functions to help you acomplish *something*. Libraries give you new tools to use but don't necessarily tell you how to use it. Frameworks, on the other hand, are tailored to solve a certain problem. Frameworks offer new tools as well as an opinionated ways to use them in order to solve that said problem.

The React 'Ecosystem' is a bit of a different situation because react itself is said to be just a library because it doesn't tell you how to build an application, it only gives you a vDOM. The interesting thing is that other tools have been developed around React to compliment its meta. Altogether this creates the 'React ecosystem'--a community built 'framework' that's not necessarily packaged up together.

Again, Harmony is a *framework* meaning it will tell you *how* to do everything.

## Prior Art: Why Harmony?

I'd like to remind everyone of their [favorite xkcd comic](http://xkcd.com/927/)

![standards](http://imgs.xkcd.com/comics/standards.png)

I really don't have any negative things to say about this, I just think it's funny (and correct!).

Admittingly, I would consider myself to be at least somewhat of a [magpie developer](https://blog.codinghorror.com/the-magpie-developer/) but my reason for finding the next 'new and shiny' isn't simply because it's new and shiny--it's because the current state-of-the-art doesn't solve all the problems (and now I'm the person in that comic :sweat:).

**To truly understand why I'm attempting to make another of the seemingly endless frontend frameworks, you'll have to understand the prior art.**

The following section will discuss the 'evolution' of recent application development. We'll discuss the pros and cons of certain methodologies and maybe, just maybe, we can make something better.

### Two-way Data Binding: Backbone, Angular, Ember, Vue etc...

Two-way data binding is a method for automatically transmit

### Unidirectional Data Flow: React and Cycle.js

### Single State Store: Elm and Redux

### Composing Side-Effects: ReactiveX

## The Meta

### Simple as Possible

* small teams, hackathon ready, minimal but powerful api, no classes, no this

### Functional First: Don't Mutate State

### 



## Example 

The code below results in:

![example picture](https://github.com/ricokahler/harmony/blob/master/Capture.PNG).

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

harmonize(container, '#example');
```

# terminology

* **model** an object that represents the data inside the application
* **state** a snapshot of a model in time

# misc pros of framework

* (unlike cycle,) you don't have to selector the element to get an event stream
* (unlike reduce,) you don't have to dispatch an action and a payload, you directly change the model (no indirection)
