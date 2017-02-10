export function mapObj(obj, mapper) {
    return (Object
        .keys(obj)
        .map(key => ({ key, value: obj[key] }))
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

export function hash(str) {
    str = str || '';
    var hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash + '';
};
