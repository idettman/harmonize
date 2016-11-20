import {Map} from 'immutable';

const persistent = <T>(model: T) => {
    const map = Map(model);
    const t = (Object
        .keys(model)
        .map(key => ({key, value: model[key]}))
        .reduce((obj, {key, value}) => {

            obj[key] = {
                get [key]() { return map.get(key) },
                assign: value => map.set(key, value),
                update: updater => map.update(key, updater)

            };
            return obj;
        }, {} as T)
    )
};

/*

const thing = persistent({name: 'Rico', age: 20, parent: {
    name: 'Tess',
    age: 999
}});
thing.name()
thing.name().parent()
thing.name.assign(value)
thing.name._← value



 */