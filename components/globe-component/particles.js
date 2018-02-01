import * as THREE from 'three'
import { loadData } from 'd3-jetpack'
import { scaleLinear } from 'd3-scale'
import { range } from 'd3-array'
import { color } from 'd3-color'
import { lat2rad, lon2rad } from './common'
import { metrics } from './metrics'
import { GLOBE_RADIUS, INIT_ANGLE, INIT_AXIS } from './constants'

const rgb2unit = scaleLinear()
  .domain([0, 255])
  .range([0, 1])

const height = scaleLinear()
  .domain([0, 5])
  .range([0, 0])
  // .range([0, 0.03])
  // .range([0, 0.18])
  .clamp(true)

const c = scaleLinear()
  .domain(range(6))

class Particles {
  constructor (state) {
    this.state = state
    this.data = []

    this.uniforms = {
      time: { value: 0 }
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: require('./glsl/dot.vert.glsl'),
      fragmentShader: require('./glsl/dot.frag.glsl'),
      depthTest: true,
      vertexColors: true
    })

    this.geometry = new THREE.BufferGeometry()
    this.mesh = new THREE.Points(this.geometry, this.material)
  }

  update () {
    this.geometry.attributes.position.set(metrics[this.state.current].positions)
    this.geometry.attributes.targetPosition.set(metrics[this.state.target].positions)
    this.geometry.attributes.color.set(metrics[this.state.current].colors)
    this.geometry.attributes.targetColor.set(metrics[this.state.target].colors)
    this.geometry.attributes.value.set(metrics[this.state.target].values)
    this.geometry.attributes.ix.set(metrics[this.state.target].indices)

    this.geometry.attributes.value.needsUpdate = true
    this.geometry.attributes.ix.needsUpdate = true
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.targetPosition.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.targetColor.needsUpdate = true

    this.uniforms.time.value = 0
  }

  load (finished) {
    const that = this

    loadData('data/land.csv', (err, result) => {
      if (err) {
        console.error('particle data could not be loaded')
      }
      this.data = result[0]
        .map(d => ({
          lat: lat2rad(+d.lat),
          lon: lon2rad(+d.lon),
          g: +d.GRAY50MSRW,
          // bt: +d.BT,
          // ba: +d.BA,
          hfo: +d.HFO_s,
          dro: +d.DRO_s,
          wri: +d.WRI_s,
          wsv: +d.WSV_s,
          sv: +d.SV_s,
          eco_s: +d.ECO_S_s
        }))
        .sort((a, b) => b[this.state.target] - a[this.state.target])

      that.initGeometry()

      Object.keys(metrics).forEach((m) => {
        metrics[m].positions = new Float32Array(this.data.length * 3)
        metrics[m].colors = new Float32Array(this.data.length * 3)
        metrics[m].values = new Float32Array(this.data.length)
        metrics[m].indices = new Float32Array(this.data.length)

        if (m === 'init') {
          this.data.forEach((d, i) => {
            // TODO: why does it not start with zero?
            metrics[m].positions[(i * 3) + 1] = 0.04 * ((i % 300) - 150)
            metrics[m].positions[(i * 3) + 0] = 0.04 * ((Math.floor(i / 300)) - 150)
            metrics[m].positions[(i * 3) + 2] = 0

            metrics[m].colors[(i * 3) + 0] = 0
            metrics[m].colors[(i * 3) + 1] = 0.5
            metrics[m].colors[(i * 3) + 2] = 0.8

            metrics[m].values[i] = 5
            metrics[m].indices[i] = i
          })
        } else {
          c.range(metrics[m].colorRange)

          this.data.forEach((d, i) => {
            const radius = (GLOBE_RADIUS + height(d[m]))

            const x = radius * Math.sin(d.lat) * Math.cos(d.lon)
            const y = radius * Math.sin(d.lat) * Math.sin(d.lon)
            const z = radius * Math.cos(d.lat)

            const pos = new THREE.Vector3(x, y, z)
            pos.applyAxisAngle(INIT_AXIS, INIT_ANGLE)

            metrics[m].positions[(i * 3) + 0] = pos.x
            metrics[m].positions[(i * 3) + 1] = pos.y
            metrics[m].positions[(i * 3) + 2] = pos.z

            const rgb = d[m] < 0 || d.lat < lat2rad(-60) ? { r: 76, g: 76, b: 76 } : color(c(d[m]))
            metrics[m].colors[(i * 3) + 0] = rgb2unit(rgb.r)
            metrics[m].colors[(i * 3) + 1] = rgb2unit(rgb.g)
            metrics[m].colors[(i * 3) + 2] = rgb2unit(rgb.b)

            metrics[m].values[i] = d[m]
            metrics[m].indices[i] = i
          })
        }
      })

      if (finished) {
        finished()
      }
    })
  }

  initGeometry () {
    const positions = new Float32Array(this.data.length * 3)
    this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))

    const targetPositions = new Float32Array(this.data.length * 3)
    this.geometry.addAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3))

    const colors = new Float32Array(this.data.length * 3)
    this.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

    const targetColors = new Float32Array(this.data.length * 3)
    this.geometry.addAttribute('targetColor', new THREE.BufferAttribute(targetColors, 3))

    const values = new Float32Array(this.data.length)
    this.geometry.addAttribute('value', new THREE.BufferAttribute(values, 1))

    const indices = new Float32Array(this.data.length)
    this.geometry.addAttribute('ix', new THREE.BufferAttribute(indices, 1))
  }
}

export default Particles