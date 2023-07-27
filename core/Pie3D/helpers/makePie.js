import { arc, pie } from 'd3-shape'

export default function makePie(
  data,
  innerRadius,
  outerRadius,
  cornerRadius,
  paddingAngle
) {
  const arcs = pie().value((d) => d._pieValue)(data)

  const arcGenerator = arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(cornerRadius)
    .padAngle(paddingAngle)
  const pieSvgDataUri = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg">
    <g transform="scale(1)">
      ${arcs.map((arcData) => {
        return `<path d="${arcGenerator(arcData)}" />`
      })}
      </g>
    </svg>
  `)}`

  return { pieSvgDataUri, arcs, arcGenerator }
}
