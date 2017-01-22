export function mapObj(obj, mapper) {
    return (Object
        .keys(obj)
        .map(key => ({key, value: obj[key]}))
        .map(({key, value}) => ({
            key,
            mappedValue: mapper(value, key)
        }))
        .reduce((newObj, {key, mappedValue}) => {
            newObj[key] = mappedValue;
            return newObj;
        }, {})
    );
}