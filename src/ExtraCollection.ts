import { Collection } from '@discordjs/collection'
export class ExtendCollection<K, V> extends Collection<K, V> {
  set(key: K, value: V, index?: number): this {
    if (typeof index === "number") {
      return this.setBefore(key, value, super.keyAt(index) as K)
    }
    super.set(key, value)
    return this
  };
  setAfter(key: K, value: V, baseKey: K): this {
    const copyCollection = super.clone()
    super.clear()
    let keySet = false
    copyCollection.forEach((value_, key_) => {
      super.set(key_, value_)
      if (baseKey === key_) {
        keySet = true
        super.set(key, value)
      }
    })
    if (!keySet) super.set(key, value)
    return this
  };
  setBefore(key: K, value: V, baseKey: K): this {
    const copyCollection = super.clone()
    super.clear()
    let keySet = false
    copyCollection.forEach((value_, key_) => {
      if (baseKey === key_) {
        keySet = true
        super.set(key, value)
      }
      super.set(key_, value_)
    })
    if (!keySet) super.set(key, value)
    return this
  };
  toCollection(): Collection<K, V> {
    return new Collection(this)
  };
  toMap(): Map<K, V> {
    return new Map(this)
  };
  getIndex(key: K): number {
    let index = 0,
    found = false
    super.forEach((_, key_) => {
      if (found || key === key_) {
        found = true
      } else index++
    })
    if (found) return index
    else return -1
  }
  exchange(key1: K, key2: K): boolean {
    const value1 = super.get(key1),
    value2 = super.get(key2),
    index1 = this.getIndex(key1),
    index2 = this.getIndex(key2)
    if (key1 === key2 || value1 === undefined || value2 === undefined || index1 === -1 || index2 === -1) return false
    super.delete(key1)
    super.delete(key2)
    if (index1 < index2) {
      this.set(key2, value2, index1)
      this.set(key1, value1, index2)
    } else {
      this.set(key1, value1, index2)
      this.set(key2, value2, index1)
    }
    return true
  }
  exchangeAt(index1: number, index2: number): boolean {
    const value1 = super.at(index1),
    value2 = super.at(index2),
    key1 = this.keyAt(index1),
    key2 = this.keyAt(index2)
    if (index1 === index2 || value1 === undefined || value2 === undefined || key1 === undefined || key2 === undefined) return false
    super.delete(key1)
    super.delete(key2)
    if (index1 < index2) {
      this.set(key2, value2, index1)
      this.set(key1, value1, index2)
    } else {
      this.set(key1, value1, index2)
      this.set(key2, value2, index1)
    }
    return true
  }
};