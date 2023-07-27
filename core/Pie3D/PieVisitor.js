import { MOUSE_EVENT_TYPE, MESH_TYPE } from './constants'
import EventManager from './EventManager'

class PieHoverVisitor extends EventManager {
  constructor() {
    super()
    this.actionType = MOUSE_EVENT_TYPE.HOVER
    this.visitedMeshs = new Set()
  }

  visite(meshs, mouse) {
    for (let i = 0; i < meshs.slice(0, 1).length; i++) {
      const mesh = meshs[i]
      mesh.__visited__ = true
      mesh.__animate__.active()
      this.emit('hover', { mesh, mouse })
      this.addVisitedMesh(mesh)
    }
  }

  withoutVisite(intersectMeshs) {
    const pieGroupMeshs = intersectMeshs.filter(item => item.__meshType__ === MESH_TYPE.PIE_GROUP)
    if (!pieGroupMeshs.length) {
      this.emit('unhoverPieGroup')
    }
    const intersectMeshsSet = new Set(pieGroupMeshs.slice(0, 1))
    this.visitedMeshs.forEach(mesh => {
      if (!intersectMeshsSet.has(mesh)) {
        mesh.__visited__ = false
        mesh.__animate__.deactive()
        this.removeVisitedMesh(mesh)
      }
    })
  }

  addVisitedMesh(mesh) {
    this.visitedMeshs.add(mesh)
  }

  removeVisitedMesh(mesh) {
    this.visitedMeshs.delete(mesh)
  }
}

class PieClickVisitor extends EventManager {
  constructor() {
    super()
    this.actionType = MOUSE_EVENT_TYPE.CLICK
    this.visitedMeshs = new Set()
  }

  visite(intersects, mouse) {
    for (let i = 0; i < intersects.slice(0, 1).length; i++) {
      const mesh = intersects[i]
      mesh.__animate__.active()
      this.emit('click', { mesh, mouse })
      this.visitedMeshs.add(mesh)
    }
  }

  withoutVisite(intersectMeshs) {
    const pieGroupMeshs = intersectMeshs.filter(item => item.__meshType__ === MESH_TYPE.PIE_GROUP)
    const intersectMeshsSet = new Set(pieGroupMeshs.slice(0, 1))
    this.visitedMeshs.forEach(mesh => {
      if (!intersectMeshsSet.has(mesh)) {
        mesh.__visited__ = false
        mesh.__animate__.deactive()
        this.visitedMeshs.delete(mesh)
      }
    })
  }
}

export default class PieVisitor extends EventManager {
  constructor() {
    super()
    this.type = MESH_TYPE.PIE_GROUP
    this.pieHoverVisitor = null
    this.pieClickVisitor = null
    this.init()
  }

  initHoverVisitor() {
    this.pieHoverVisitor = new PieHoverVisitor()
    this.pieHoverVisitor.on('hover', (mesh) => {
      this.emit('hover', mesh)
    })
    this.pieHoverVisitor.on('unhoverPieGroup', () => {
      this.emit('unhoverPieGroup')
    })
    this.pieHoverVisitor.on('deactive', (mesh) => {
      this.emit('deactive', mesh)
    })
  }

  initClickVisitor() {
    this.pieClickVisitor = new PieClickVisitor()
    this.pieHoverVisitor.on('click', (mesh) => {
      this.emit('click', mesh)
    })
    this.pieHoverVisitor.on('deactive', (mesh) => {
      this.emit('deactive', mesh)
    })
  }

  init() {
    this.initHoverVisitor()
    this.initClickVisitor()
  }
}