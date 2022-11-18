export function isObject(value) {
    return value !== null && typeof value === 'object';
}

export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

export function isDate(value) {
    return Object.prototype.toString.call(value) === '[object Date]';
}

export function isPresent(value) {
    return typeof value !== 'undefined' && value !== null;
}
