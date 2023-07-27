export default class Event {
  constructor() {
    this.callbacks = new Map()
  }
  on(eventName, callback) {
    let callbacks = this.callbacks.get(eventName)
    if (!callbacks) {
      callbacks = new Set()
      this.callbacks.set(eventName, callbacks)
    }
    callbacks.add(callback)
  }
  remove(eventName, callback) {
    const callbacks = this.callbacks.get(eventName)
    if (!callbacks) return
    callbacks.delete(callback)
  }
  emit(eventName, params) {
    const callbacks = this.callbacks.get(eventName)
    if (!callbacks) return
    callbacks.forEach(callback => callback(params))
  }
}
