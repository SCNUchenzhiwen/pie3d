import EventManager from "./EventManager"
import PieAnimate from './PieAnimate'
import makePie from './helpers/makePie'
import { resolveDataWhithMinAngle, resolvePieDepth, resolveDataPercent, resolveDataColor, resolveMeshOpacityByCameraPlane } from './helpers'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import PieSlice from './PieSlice'
import {
  Group,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Scene,
  PCFSoftShadowMap,
  Clock,
  Vector2,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  MathUtils,
  AxesHelper,
  CameraHelper,
  Euler
} from 'three'
import CameraControls from 'camera-controls'
import * as TWEEN from '@tweenjs/tween.js'
import RaycasterEvent from "./RaycasterEvent"
import PieVisitor from "./PieVisitor"
import ToolTip from './ToolTip'
import { MESH_TYPE, PIE_MESH_DATA_KEY } from './constants'

const subsetOfTHREE = {
  Vector2,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  MathUtils,
  Vector3
}

CameraControls.install({ THREE: subsetOfTHREE })

const DEFAULT_EXTRUDE_SETTINGS = {
  curveSegments: 32,
  steps: 1,
  depth: 5,
  bevelEnabled: false,
  bevelThickness: 0.01,
  bevelSize: 0.01,
  bevelOffset: 0.0,
  bevelSegments: 5,
}

const DEFAULT_OPTIONS = {
  castShadow: true,
  container: document.body,
  stepHeightEnable: true,
  explosionMagnitude: 6
}

const DEFAULT_PIE_OPTIONS = {
  innerRadius: 16,
  outerRadius: 50,
  cornerRadius: 2,
  paddingAngle: 1 * Math.PI / 180,
  minAngle: 0.05,
  roughness: 0.2,
  metalness: 0,
  showValues: true,
  valueLabelPosition: 0.65,
  valuesAsPercent: true,
  minDepth: DEFAULT_EXTRUDE_SETTINGS.depth * 0.1,
  maxDepth: DEFAULT_EXTRUDE_SETTINGS.depth * 1.2
}

const DEFAULT_CONTROLLER_OPTIONS = {
  polarAngle: 0.35 * Math.PI,
  azimuthAngle: 0
}

const DEFAULT_LABEL_OPTIONS = {
  offsetDepth: DEFAULT_EXTRUDE_SETTINGS.depth * 0.4,
  color: '#111',
  fontSize: 28,
  valueFontSize: 32,
  valueColor: '#111',
  showValue: true,
  showLabel: true
}

const TOOL_TIP_FORMAT = data => `${data.label}: ${data.value}`

export default class Pie3D extends EventManager {
  constructor(options = {}) {
    super()
    this.options = { ...DEFAULT_OPTIONS, controller: { ...DEFAULT_CONTROLLER_OPTIONS }, ...options }
    this.extrudeSettings = DEFAULT_EXTRUDE_SETTINGS
    this.pieOptions = { ...DEFAULT_PIE_OPTIONS }
    this.labelOptions = { ...DEFAULT_LABEL_OPTIONS }
    this.camera = null
    this.scene = null
    this.ambientLight = null
    this.directionalLight = null
    this.renderer = null
    this.controller = null
    this.clock = null
    this.refId = null
    this.raycasterEvent = null
    this.toolTip = null
    this.labelMeshs = []
    this.valueLabelMeshs = []

    this.needUpdate = false

    this.init()
  }

  initCamera() {
    const { container } = this.options
    const { offsetWidth, offsetHeight } = container
    this.camera = new PerspectiveCamera(75, offsetWidth / offsetHeight, 0.1, 1000)
    this.camera.position.z = 100
    this.camera.position.x = 0
    this.camera.position.y = 0
    this.camera.lookAt(new Vector3(0, 0, 0))
  }

  initSence() {
    this.scene = new Scene()
    this.scene.background = null
  }

  initLight() {
    const { castShadow } = this.options
    this.directionalLight = new DirectionalLight(0xffffff, 0.5)
    this.directionalLight.position.x = 50
    this.directionalLight.position.y = 50
    this.directionalLight.position.z = 0
    if (castShadow) {
      this.directionalLight.castShadow = true
      this.directionalLight.shadow.camera.near = 0.5
      this.directionalLight.shadow.camera.far = 300
      this.directionalLight.shadow.camera.left = -100
      this.directionalLight.shadow.camera.right = 100
      this.directionalLight.shadow.camera.top = -100
      this.directionalLight.shadow.camera.bottom = 100
      this.directionalLight.shadow.mapSize.set(1024,1024)
    }
    this.ambientLight = new AmbientLight(0xffffff, 0.5)

    this.scene.add(this.ambientLight)
    this.scene.add(this.directionalLight)
  }

  initRenderer() {
    const { container } = this.options
    const { offsetWidth, offsetHeight } = container
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer : true
    })
    this.renderer.setSize(offsetWidth, offsetHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)
  }

  initController() {
    const { controller } = this.options
    this.clock = new Clock()
    this.controller = new CameraControls(
      this.camera,
      this.renderer.domElement
    )
    this.controller.polarAngle = controller.polarAngle
    this.controller.azimuthAngle = controller.azimuthAngle
    this.originPolarAngle = this.controller.polarAngle
  }

  initHelper() {
    const axesHelper = new AxesHelper( 50 )
    const lightHelper = new CameraHelper( this.directionalLight.shadow.camera )
    this.scene.add(axesHelper)
    this.scene.add(lightHelper)
  }

  initRaycasterEvent() {
    const options = {
      camera: this.camera,
      renderer: this.renderer,
      scene: this.scene
    }
    this.raycasterEvent = new RaycasterEvent(options)
  }

  initToolTip() {
    const { container } = this.options
    this.toolTip = new ToolTip({ container, format: TOOL_TIP_FORMAT })
  }

  onHoverPieSlice({ mesh, mouse }) {
    const data = mesh[PIE_MESH_DATA_KEY]
    this.toolTip && this.toolTip.showToolTip({ content: data, mouse })
  }

  initPieVistor() {
    this.pieVisitor = new PieVisitor()
    this.pieVisitor.on('hover', ({ mesh, mouse }) => {
      this.emit('hover', mesh)
      this.onHoverPieSlice({ mesh, mouse })
    })
    this.pieVisitor.on('unhoverPieGroup', () => {
      this.toolTip && this.toolTip.hideToolTip()
    })
    this.pieVisitor.on('click', ({ mesh }) => this.emit('click', mesh))
    this.raycasterEvent.acceptIntersectVisitor(this.pieVisitor.pieHoverVisitor, MESH_TYPE.PIE_GROUP)
    this.raycasterEvent.acceptIntersectVisitor(this.pieVisitor.pieClickVisitor, MESH_TYPE.PIE_GROUP)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  animate() {
    TWEEN.update()
    const delta = this.clock.getDelta()
    this.controller.update(delta)
    this.refId = requestAnimationFrame(this.animate.bind(this))
    this.render()
    this.updateLabelForward(this.controller)
  }

  init() {
    this.initSence()
    this.initCamera()
    this.initLight()
    this.initRenderer()
    this.initController()
    this.animate()
    // this.initHelper()
    this.initRaycasterEvent()
    this.initPieVistor()
    this.initToolTip()
  }

  async updateData(data) {
    this.data = data
    this.resolveData()
    this.clear()
    await this.renderPie()
    // this.initHelper()
  }

  resolveData() {
    const { data, stepHeightEnable } = this.options
    const { depth } = this.extrudeSettings
    const { minDepth, minAngle, paddingAngle, maxDepth } = this.pieOptions
    resolvePieDepth({ data, minDepth, maxDepth, stepHeightEnable, depth })
    resolveDataWhithMinAngle({ data, minAngle, paddingAngle })
    resolveDataPercent(data)
    resolveDataColor(data)
  }

  invokePieAnimate(pieSliceGroups) {
    pieSliceGroups.forEach(pieGroup => {
      new PieAnimate({ TWEEN: TWEEN, pieGroup, ...this.options })
    })
  }

  async resolveShapes() {
    const { data } = this.options
    const { innerRadius, outerRadius, cornerRadius, paddingAngle } = this.pieOptions
    const pie = makePie(data, innerRadius, outerRadius, cornerRadius, paddingAngle)
    const loader = new SVGLoader()
    const { paths: shapePaths }= await loader.loadAsync(pie.pieSvgDataUri)
    const shapes = shapePaths.map(path => SVGLoader.createShapes(path))
    return { shapes, pie }
  }

  async generatePieGroup() {
    const { shapes, pie } = await this.resolveShapes()
    const pieSliceGroups = []
    shapes.forEach((shape, index) => {
      const pieSliceGroup = new PieSlice({ shape, pie, index, extrudeSettings: this.extrudeSettings, ...this.options, ...this.pieOptions, labelOptions: this.labelOptions, visitor: this.pieVisitor }).create()
      pieSliceGroups.push(pieSliceGroup)
    })
    this.labelMeshs = pieSliceGroups.map(pieSliceGroup => pieSliceGroup.children.filter(mesh => mesh.__meshType__ === MESH_TYPE.PIE_LABEL)[0]).filter(item => item)
    this.valueLabelMeshs = pieSliceGroups.map(pieSliceGroup => pieSliceGroup.children.filter(mesh => mesh.__meshType__ === MESH_TYPE.PIE_VALUE_LABEL)[0]).filter(item => item)
    this.invokePieAnimate(pieSliceGroups)
    const pieGroup = new Group()
    pieGroup.add(...pieSliceGroups)
    return pieGroup
  }

  updateLabelForward(controller) {
    const { polarAngle, azimuthAngle, camera } = controller
    resolveMeshOpacityByCameraPlane({ camera, meshs: this.labelMeshs, interval: 0.3 })
    // resolveMeshOpacityByCameraPlane({ camera, meshs: this.valueLabelMeshs, interval: 0.3 })
    this.labelMeshs.forEach(labelMesh => {
      labelMesh.setRotationFromEuler(new Euler(polarAngle, 0, azimuthAngle, 'ZXY'))
    })
    this.valueLabelMeshs.forEach(valueLabelMesh => {
      valueLabelMesh.setRotationFromEuler(new Euler(polarAngle, 0, azimuthAngle, 'ZXY'))
    })
  }

  async renderPie() {
    const pieGroup = await this.generatePieGroup()
    this.scene.add(pieGroup)
  }

  clear() {
    const clearMesh = (mesh) => {
      if (mesh.isMesh) {
        mesh.geometry.dispose && mesh.geometry.dispose()
        mesh.material.dispose && mesh.material.dispose()
      }
    }
    const clearGroup = (group) => {
      const clearChildren = group.children.filter(item => !item.isLight)
      clearChildren.forEach(item => {
        if (item.children) {
          clearGroup(item)
        }
        if (item.isMesh) {
          clearMesh(item)
        }
        group.remove(item)
      })
      group.parent && group.parent.remove(group)
      if (clearChildren.length) {
        clearGroup(group)
      }
    }
    clearGroup(this.scene)
  }

  disposeAnimate() {
    this.refId && cancelAnimationFrame(this.refId)
  }

  dispose() {
    this.disposeAnimate()
    this.clear()
  }
}
