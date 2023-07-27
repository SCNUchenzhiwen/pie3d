import EventManager from "./EventManager"
import { resolvePieOffset } from './helpers'

export default class PieAnimate extends EventManager {
  constructor(options = {}) {
    super()
    this.options = options
    this.pieGroup = this.options.pieGroup
    this.TWEEN = this.options.TWEEN

    this.initAnimate()
  }

  initAnimate() {
    this.pieGroup.__animate__ = {
      active: this.activeAnimate.bind(this),
      deactive: this.deactiveAnimate.bind(this),
      createNextTask: this.createNextTask.bind(this),
      nextTask: null
    }
  }

  createNextTask(animatefunc) {
    const task = function() {
      animatefunc && animatefunc.call(this)
      this.pieGroup.__animate__.nextTask = null
    }
    this.pieGroup.__animate__.nextTask = task.bind(this)
  }

  excuteNextTask() {
    if (this.pieGroup.__animate__.nextTask) {
      this.pieGroup.__animate__.nextTask()
    }
  }

  activeAnimate() {
    if (this.pieGroup.__animating__) {
      this.createNextTask(this.activeAnimate)
      return
    }
    if (this.pieGroup.__isActive__) return
    const { explosionMagnitude } = this.options
    const originPosition = this.pieGroup.__originPosition__
    const currentPosition = this.pieGroup.position
    const middleAngle = this.pieGroup.__middleAngle__
    const { offsetX, offsetZ } = resolvePieOffset({ angle: middleAngle, explosionMagnitude })
    const targetPosition = {
      x: originPosition.x + offsetX,
      z: originPosition.z + offsetZ
    }
    const tween = new this.TWEEN.Tween({ ...currentPosition }).to(targetPosition, 300).easing(this.TWEEN.Easing.Back.Out)
    tween.onUpdate(({ x, z }) => {
      this.pieGroup.position.x = x
      this.pieGroup.position.z = z
    })
    tween.onComplete(() => {
      this.pieGroup.__animating__ = false
      this.excuteNextTask()
    })
    tween.start()
    this.pieGroup.__animating__ = true
    this.pieGroup.__isDeactive__ = false
    this.pieGroup.__isActive__ = true
  }

  deactiveAnimate() {
    if (this.pieGroup.__animating__) {
      this.createNextTask(this.deactiveAnimate)
      return
    }
    if (this.pieGroup.__isDeactive__) return
    const originPosition = this.pieGroup.__originPosition__
    const currentPosition = this.pieGroup.position
    const tween = new this.TWEEN.Tween({ ...currentPosition }).to({ ...originPosition }, 300).easing(this.TWEEN.Easing.Back.Out)
    tween.onUpdate(({ x, z }) => {
      this.pieGroup.position.x = x
      this.pieGroup.position.z = z
    })
    tween.onComplete(() => {
      this.pieGroup.__animating__ = false
      this.excuteNextTask()
    })
    tween.start()
    this.pieGroup.__animating__ = true
    this.pieGroup.__isDeactive__ = true
    this.pieGroup.__isActive__ = false
  }
}
