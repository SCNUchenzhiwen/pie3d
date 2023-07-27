import { ExtrudeGeometry, MeshStandardMaterial, Mesh, Group } from 'three'
import EventManager from './EventManager'
import { PIE_MESH_DATA_KEY, MESH_TYPE } from './constants'
import Billboard from './Billboard'

const DEFAULT_OPTIONS = {
  valueLabelPosition: 0.5,
  offset: 0,
  roughness: 0.2,
  metalness: 0,
  showValue: true,
  valueAsPercent: true,
  paddingAngle: 10 * Math.PI / 180
}

export default class PieSlice extends EventManager {
  constructor(options = {}) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.labelOptions = options.labelOptions
  }

  generateLabelMesh(pieMesh) {
    const { data, index, outerRadius, innerRadius } = this.options
    const { label, _pieDepth, value } = data[index]
    const { valueFontSize, offsetDepth, showValue } = this.labelOptions
    if (!label) return null
    const { __middleAngle__, position } = pieMesh
    const offsetX = (outerRadius + innerRadius) / 2 * Math.cos(__middleAngle__ - 0.5 * Math.PI)
    const offsetY = (outerRadius + innerRadius) / 2 * Math.sin(__middleAngle__ - 0.5 * Math.PI)
    const labelMesh = new Billboard({ text: `${label}: ${value}`, ...this.labelOptions }).generateTextMesh()
    labelMesh.position.x = position.x + offsetX
    labelMesh.position.y = position.y + offsetY
    const valueLabelDepth = offsetDepth + valueFontSize / 8
    labelMesh.position.z = _pieDepth + offsetDepth + (showValue ? valueLabelDepth : 0)
    labelMesh.rotateX(0.5 * Math.PI)
    labelMesh.__meshType__ = MESH_TYPE.PIE_LABEL
    labelMesh.__data__ = data[index]
    pieMesh.__label__ = labelMesh
    return labelMesh
  }

  generateValueLabelMesh(pieMesh) {
    const { data, index, outerRadius, innerRadius } = this.options
    const { offsetDepth } = this.labelOptions
    const { _percent, _pieDepth } = data[index]
    if (!_percent) return null
    const { __middleAngle__, position } = pieMesh
    const offsetX = (outerRadius + innerRadius) / 2 * Math.cos(__middleAngle__ - 0.5 * Math.PI)
    const offsetY = (outerRadius + innerRadius) / 2 * Math.sin(__middleAngle__ - 0.5 * Math.PI)
    const fontOptions = {
      fontSize: this.labelOptions.valueFontSize,
      color: this.labelOptions.valueColor
    }
    const valueLabelMesh = new Billboard({ text: _percent, ...fontOptions }).generateTextMesh()
    valueLabelMesh.position.x = position.x + offsetX
    valueLabelMesh.position.y = position.y + offsetY
    valueLabelMesh.position.z = _pieDepth + offsetDepth
    valueLabelMesh.rotateX(0.5 * Math.PI)
    valueLabelMesh.__meshType__ = MESH_TYPE.PIE_VALUE_LABEL
    pieMesh.__valueLabel__ = valueLabelMesh
    return valueLabelMesh
  }

  generatePieMesh() {
    const { data, index, shape, extrudeSettings, roughness, metalness, castShadow, pie } = this.options
    const arcs = pie.arcs
    const arc = arcs[index]
    const pieData = data[index]
    const middleAngle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2
    const geometry = new ExtrudeGeometry(shape, { ...extrudeSettings, depth: pieData._pieDepth })
    const material = new MeshStandardMaterial({
      roughness,
      metalness,
      color: pieData.color
    })
    const mesh = new Mesh(geometry, [material, material])
    mesh[PIE_MESH_DATA_KEY] = data[index]
    mesh.__middleAngle__ = middleAngle
    mesh.__originPosition__ = { ...mesh.position }
    mesh.__isPie__ = true
    mesh.__meshType__ = MESH_TYPE.PIE
    mesh.__isActive__ = false
    mesh.__isDeactive__ = true
    if (castShadow) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }

    return mesh
  }

  generatePieGroup() {
    const { data, index, explosionMagnitude } = this.options
    // const { pieHoverVisitor } = visitor
    const { showValue } = this.labelOptions
    const pieData = data[index]
    const pieMesh = this.generatePieMesh()
    const pieLabelMesh = this.generateLabelMesh(pieMesh)
    const pieValueLabelMesh = showValue ? this.generateValueLabelMesh(pieMesh) : null
    const pieGroup = new Group()

    pieGroup.add(pieMesh)
    pieLabelMesh && pieGroup.add(pieLabelMesh)
    pieValueLabelMesh && pieGroup.add(pieValueLabelMesh)
    pieGroup.rotateX(-0.5 * Math.PI)
    const { __middleAngle__ } = pieMesh
    pieGroup[PIE_MESH_DATA_KEY] = pieMesh[PIE_MESH_DATA_KEY]
    pieGroup.__originPosition__ = { ...pieGroup.position }
    pieGroup.__isPieGroup__ = true
    pieGroup.__meshType__ = MESH_TYPE.PIE_GROUP
    pieGroup.__isActive__ = false
    pieGroup.__isDeactive__ = true
    pieGroup.__middleAngle__ = __middleAngle__
    if (pieData.explore) {
      const offsetX = explosionMagnitude * Math.sin(__middleAngle__)
      const offsetZ = explosionMagnitude * Math.cos(__middleAngle__)
      pieGroup.position.x = offsetX
      pieGroup.position.z = offsetZ
      pieGroup.__isActive__ = true
      pieGroup.__isDeactive__ = false
      // pieHoverVisitor.addVisitedMesh(pieGroup)
    }
    return pieGroup
  }

  create() {
    return this.generatePieGroup()
  }
}
