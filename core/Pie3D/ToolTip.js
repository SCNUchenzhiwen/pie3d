import { getMousePosition } from './helpers'

const DEFAULT_STYLE = {
  position: 'absolute',
  left: `-999999px`,
  roght: `-9999999px`,
  zIndex: 9999,
  ['transform-origin']: `0 0`,
  display: 'inline-flex',
  transform: `translate(0, 0)`,
  ['transition-delay']: 0,
  // ['transition-duration']: `0.3s`,
  // ['transition-timing-function']: 'ease-in-out',
  background: '#ffffff',
  color: '#333',
  fontSize: '14px',
  padding: '10px',
  ['border-radius']: `10px`,
  ['box-shadow']: `5px 5px 5px #aaa`,
  ['box-sizing']: 'border-box',
  opacity: 0,
  ['pointer-events']: 'none'
}

const DEFAULT_OPTIONS = {
  container: document.body,
  style: { ...DEFAULT_STYLE }
}

const nextTick = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 10)
  })
}

export default class ToolTip {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.el = null
    this.elSize = {}
    this.format = options.format || (value => value)
    this.createElement()
    this.initEvent()
  }
  parseCssText(style) {
    return Object.keys(style).map(key => `${key}: ${style[key]}`).join('; ')
  }
  updateFormat(format) {
    this.format = format
  }
  async updateContent(content) {
    this.el.innerHTML = this.format(content)
    await this.computeElSize()
  }
  async computeElSize() {
    await nextTick()
    this.elSize = {
      width: this.el.clientWidth,
      height: this.el.clientHeight
    }
  }
  computeTranslate(mouseOffset) {
    const { container } = this.options
    const { x, y } = mouseOffset
    const { clientWidth, clientHeight } = container
    const { width, height } = this.elSize
    const maxX = clientWidth - width - 5
    const maxY = clientHeight - height - 5
    let translateX = x
    let translateY = y
    translateX > maxX && (translateX = maxX)
    translateY > maxY && (translateY = maxY)
    return {
      translateX,
      translateY
    }
    
  }
  async showToolTip({ content, mouse }) {
    this.el.style.display = 'inline-flex'
    this.el.style.opacity = 1
    this.el.style.left = 0
    this.el.style.top = 0
    await this.updateContent(content)
    await this.computeElSize()
    await this.updateTranslate(mouse)
  }
  initEvent() {
    const { container } = this.options
    container.addEventListener('mouseleave', () => this.hideToolTip())
  }
  hideToolTip() {
    this.el.style.display = 'none'
  }
  async updateTranslate(mouse) {
    const { container } = this.options
    const mouseOffset = getMousePosition(mouse, container)
    const { translateX, translateY } = this.computeTranslate({ x: mouseOffset.left, y: mouseOffset.top })
    this.el.style.opacity = 1
    this.el.style.left = 0
    this.el.style.top = 0
    this.el.style.transform = `translate(${translateX}px, ${translateY}px)`
  }
  createElement() {
    if (this.el) return
    const { container } = this.options
    const { style } = this.options
    const el = document.createElement('div')
    el.style.cssText = this.parseCssText(style)
    container.appendChild(el)
    this.el = el
    this.updateContent('')
  }
}