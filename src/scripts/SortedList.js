/**
 * @author : Guillaume Dauster
 */

class SortedList extends Array {
  constructor(options = {}) {
    // default compare function is for numbers
    this._compare = options.compare || (a, b) => {
      var c = a - b;
      return (c > 0) ? 1 : (c == 0) ? 0 : -1;
    };

    // is inserted values unique
    this._unique = options.unique || true;

    // the array warped into the class
    this._a = new Array();
  }
  /**
   *
   */
  bsearch(value) {
    const a = this._a;
    if (a.length === 0) return -1;
    let mpos, mval, // middle position and value
        spos = 0, epos = a.length; // start and end position

    while (epos - spos > 1) {
      mpos = Math.floor((spos + epos)/2);
      mval = a[mpos];
      var comp = this._compare(value, mval);
      if (comp == 0) return mpos;
      if (comp > 0)  spos = mpos;
      else           epos = mpos;
    }

    return (spos == 0 && this._compare(a[0], value) > 0) ? -1 : spos;
  }
  insert(value) {
    const a = this._a;
    var pos = this.bsearch(value);
    if (this._unique && this.key(val, pos) != null) return false;
    if (!this._filter(val, pos)) return false;
    this.splice(pos+1, 0, val);
    return pos+1;
  }
}
