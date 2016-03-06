const _ = require('lodash');

class YieId {
  constructor() {
    this._doned = false;
    this._thens = [];
  }
  then(callback) {
    if (!_.include(this._thens, callback)) {
      this._thens.push(callback);
    }
  }
  done() {
    if (!this._doned) {
      _.each(this._thens, callback => callback());
      this._doned = true;
    }
  }
  isDone() {
    return this._doned;
  }
}
class ArrayIterator {
  constructor(array, point) {
    this.array = array;
    this.index = point || 0;
  }
  hasNext() {
    return this.index < this.array.length;
  }
  next() {
    return this.array[this.index++];
  }
}
module.exports = {
  YieId: YieId,
  ArrayIterator: ArrayIterator
}