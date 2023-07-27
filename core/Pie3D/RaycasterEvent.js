import EventManager from "./EventManager"
import { Raycaster, Vector2 } from 'three'
import { MOUSE_EVENT_TYPE } from './constants'

export default class RaycasterEvent extends EventManager {
  constructor(options) {
    super()
    this.options = options
    this.camera = options.camera
    this.renderer = options.renderer
    this.scene = options.scene
    this.raycaster = new Raycaster()
    this.mouse = new Vector2(Infinity, Infinity)
    this.intersectVisitors = {}

    this.init()
  }

  initHover() {
    const container = this.renderer.domElement
    const { top, left, width, height } = container.getBoundingClientRect()
    const onHover = (event) => {
      const { clientX, clientY } = event
      const offsetX = clientX - left
      const offsetY = clientY - top
      this.lastMouse = { x: this.mouse.x, y: this.mouse.y }
      this.mouse.x = (offsetX / width) * 2 - 1
      this.mouse.y = -(offsetY / height) * 2 + 1
      this.updateRaycasterIntersect({ action: MOUSE_EVENT_TYPE.HOVER })
    }
    container.addEventListener('mousemove', onHover, false)
  }

  initClick() {
    const container = this.renderer.domElement
    const { top, left, width, height } = container.getBoundingClientRect()
    let mousedownClient = [0, 0]
    let mouseupClient = [0, 0]
    const mousHasMove = () => {
      return Math.pow(mousedownClient[0] - mouseupClient[0], 2) > 4 || Math.pow(mousedownClient[1] - mouseupClient[1], 2) > 4
    }
    const onClick = (event) => {
      if (mousHasMove()) return
      const { clientX, clientY } = event
      const offsetX = clientX - left
      const offsetY = clientY - top
      this.lastMouse = { x: this.mouse.x, y: this.mouse.y }
      this.mouse.x = (offsetX / width) * 2 - 1
      this.mouse.y = -(offsetY / height) * 2 + 1
      this.updateRaycasterIntersect({ action: MOUSE_EVENT_TYPE.CLICK })
    }
    container.addEventListener('click', onClick, false)
    container.addEventListener('mousedown', (e) => {
      mousedownClient = [e.clientX, e.clientY]
    }, false)
    container.addEventListener('mouseup', (e) => {
      mouseupClient = [e.clientX, e.clientY]
    }, false)
  }

  initEvent() {
    this.initClick()
    this.initHover()
  }

  updateRaycasterIntersect({ action }) {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    )
    this.withoutVisite((intersects || []).map(item => item.object.parent))
    if (!intersects.length) return
    switch(action) {
      case MOUSE_EVENT_TYPE.HOVER:
        this.onHover(intersects)
        break
      case MOUSE_EVENT_TYPE.CLICK:
        this.onClick(intersects)
        break
    }
  }

  withoutVisite(intersects) {
    Object.keys(this.intersectVisitors).forEach(meshType => {
      const visitors = this.intersectVisitors[meshType]
      visitors.forEach(visitor => {
        visitor.withoutVisite && visitor.withoutVisite(intersects)
      })
    })
  }

  isEmptyVisitors() {
    return Object.keys(this.intersectVisitors).length < 1
  }

  traverseIntersects(intersects, action) {
    if (this.isEmptyVisitors()) return
    const meshMap = {}
    const meshGroupMap = {}
    for (let i = 0; i < intersects.length; i++) {
      const mesh = intersects[i].object
      const meshGroup = intersects[i].object.parent
      if (mesh.__meshType__) {
        const { __meshType__ } = mesh
        if (this.intersectVisitors[__meshType__]) {
          !meshMap[__meshType__] && (meshMap[__meshType__] = [])
          meshMap[__meshType__].push(mesh)
        }
      }
      if (meshGroup.__meshType__) {
        const { __meshType__ } = meshGroup
        if (this.intersectVisitors[__meshType__]) {
          !meshGroupMap[__meshType__] && (meshGroupMap[__meshType__] = [])
          meshGroupMap[__meshType__].push(meshGroup)
        }
      }
    }
    const run = (meshMap) => {
      Object.keys(meshMap).forEach(meshType => {
        const visitors = this.intersectVisitors[meshType]
        visitors.filter(visitor => visitor.actionType === action).forEach(visitor => {
          visitor.visite(meshMap[meshType], this.mouse)
        })
      })
    }

    run(meshMap)
    run(meshGroupMap)
  }

  acceptIntersectVisitor(visitor, meshType) {
    !this.intersectVisitors[meshType] && (this.intersectVisitors[meshType] = [])
    this.intersectVisitors[meshType].push(visitor)
  }

  onHover(intersects) {
    this.traverseIntersects(intersects, MOUSE_EVENT_TYPE.HOVER)
  }

  onClick(intersects) {
    this.traverseIntersects(intersects, MOUSE_EVENT_TYPE.HOVER)
  }

  init() {
    this.initEvent()
  }
}