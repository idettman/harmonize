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
    var hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

/**
 * Assigns the entries of an immutable map to their keys.
 * This method mutates the object to add the keys.
 */
export function assignKeys(immut) {
    return Object.assign(immut, immut.entrySeq().reduce((obj, [key, value]) => {
        if (immut[key] === undefined) {
            Object.assign(obj, {get [key] () {return value}});
        }
        return obj;
    }, {}));
}