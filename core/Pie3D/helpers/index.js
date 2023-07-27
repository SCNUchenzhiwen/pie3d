import { COLORS } from '../config'
import { Vector3 } from 'three'

export const resolveDataWhithMinAngle = ({ minAngle, paddingAngle, data }) => {
  const dataLength = data.length
  if (dataLength < 2) {
    return data.map(item => item._pieValue = item.value)
  }
  const _minAngle = minAngle + paddingAngle
  const total = data.reduce((pre, cur) => pre + cur.value, 0)
  return data.map(item => {
    const { value } = item
    const _pieValue = total * ((2 * Math.PI - _minAngle * dataLength) * (value / total) + _minAngle) / Math.PI
    item._pieValue = _pieValue
    return item
  })
}

const getMax = (data) => data.reduce((pre, cur) => Math.max(pre, cur), -Infinity)

export const resolvePieDepth = ({ depth, minDepth, maxDepth, data, stepHeightEnable }) => {
  if (!stepHeightEnable) {
    return data.map(item => {
      item._pieDepth = depth
      return item
    })
  }
  const maxValue = getMax(data.map(item => item.value))
  const disDepth = maxDepth - minDepth
  return data.map(item => {
    const { value } = item
    const _pieDepth = disDepth * value / maxValue + minDepth
    item._pieDepth = _pieDepth
    return item
  })
}

export const resolvePieOffset = ({ angle, explosionMagnitude }) => {
  return {
    offsetX: explosionMagnitude * Math.sin(angle),
    offsetZ: explosionMagnitude * Math.cos(angle)
  }
}

export const resolveDataPercent = (data) => {
  const total = data.reduce((pre, cur) => pre + cur.value, 0)
  let totalPercent = 0
  for (let i = 0; i < data.length; i++) {
    const ratio = data[i].value / total
    let curPercentValue = Math.round(ratio * 10000)
    if (i === data.length - 1) {
      curPercentValue = 10000 - totalPercent
    }
    totalPercent += curPercentValue
    const percent = `${curPercentValue / 100}%`
    data[i]._percent = percent
    data[i]._ratio = ratio
  }
  return data
}

export const resolveDataColor = (data) => {
  const colorsLength = COLORS.length
  for (let i = 0; i < data.length; i++) {
    const colorIndex = i % colorsLength
    data[i].color = data[i].color || COLORS[colorIndex]
  }
  return data
}

export const getMousePosition = (mouse, container) => {
  const { clientWidth, clientHeight } = container
  const { x, y } = mouse
  const left = (x + 1) / 2 * clientWidth
  const top = -(y - 1) / 2 * clientHeight
  return {
    left,
    top
  }
}

export const getMeshDistanceToCameraPlane = (camera, mesh) => {
  const { position: cameraPosition } = camera
  const { position: meshPosition } = mesh
  const dot = cameraPosition.clone().dot(new Vector3(meshPosition.x, meshPosition.z, -meshPosition.y))
  const cameraPositionLength = cameraPosition.distanceTo(new Vector3(0, 0, 0))
  const distance = cameraPositionLength - (dot / cameraPositionLength)
  return {
    distance,
    mesh
  }
}

export const getNearestMeshToCameraPlane = (camera, meshs) => {
  let nearestDistance = Infinity
  let nearestMesh = null
  const distanceMap = new WeakMap()
  for (let i = 0; i < meshs.length; i++) {
    const mesh = meshs[i]
    const { distance, mesh: _mesh } = getMeshDistanceToCameraPlane(camera, mesh)
    distanceMap.set(mesh, distance)
    if (distance <= nearestDistance) {
      nearestDistance = distance
      nearestMesh = _mesh
    }
  }
  return {
    nearestDistance,
    nearestMesh,
    distanceMap
  }
}

export const resolveMeshOpacityByCameraPlane = ({ camera, meshs, interval = 10 }) => {
  const { nearestDistance, distanceMap } = getNearestMeshToCameraPlane(camera, meshs)
  for (let i = 0; i < meshs.length; i++) {
    const mesh = meshs[i]
    const distance = distanceMap.get(mesh) || Infinity
    let opacity = 1 - ((distance - nearestDistance) / interval) * 0.01
    opacity < 0 && (opacity = 0)
    mesh.material.opacity = opacity
  }
}
