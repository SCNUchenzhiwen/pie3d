import { CanvasTexture, PlaneGeometry, Mesh, MeshStandardMaterial } from 'three'

const DEFAULT_OPTIONS = {
  fontSize: 32,
  color: '#111'
}

export default class Billboard {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.text = options.text
  }

  generateCanvasText() {
    const dpr = window.devicePixelRatio * 2
    const { fontSize, color } = this.options
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px 宋体`
    const { width } = ctx.measureText(this.text)
    canvas.height = fontSize * dpr
    canvas.width = width * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${fontSize}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, fontSize)
    ctx.fillStyle = `rgba(255, 255, 255, 0)`
    ctx.fillRect(0, 0, width, fontSize)
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = `${fontSize}px 宋体`
    ctx.fillText(this.text, width / 2, fontSize / 2)
    return {
      canvas,
      width,
      height: fontSize
    }
  }

  generateTextMesh() {
    const { canvas, width, height } = this.generateCanvasText()
    const texture = new CanvasTexture(canvas)
    const geometry = new PlaneGeometry(width / 8, height / 8)
    const material = new MeshStandardMaterial({ map: texture, transparent: true })
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = false
    return mesh
  }
}