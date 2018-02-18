import * as THREE from 'three'

import { GLOBE_RADIUS } from './constants'
import { polar2cartesian, lat2theta, lon2phi } from './common'

const SCALE = 1.1

const TOO_MUCH = 0x41b6c4
const TOO_LITTLE = 0xfd8d3c
const TOO_DIRTY = 0xa63603
const THEME_COLORS = {
  'too-much': TOO_MUCH,
  'too-little': TOO_LITTLE,
  'too-dirty': TOO_DIRTY,
  'undefined': 0x666666
}

class Avatar {
  constructor (base) {
    this.textures = {}
    this.textures['too-dirty'] = new THREE.TextureLoader().load(base + 'avatars/too-dirty.png')
    this.textures['too-much'] = new THREE.TextureLoader().load(base + 'avatars/too-much.png')
    this.textures['too-little'] = new THREE.TextureLoader().load(base + 'avatars/too-little.png')
    this.textures['undefined'] = new THREE.TextureLoader().load(base + 'avatars/book.png')
    this.mesh = new THREE.Object3D()
  }

  /**
   * load avatar data and create avatar objects
   * @param  {function} finished callback function, called when done
   * @return {[type]}          [description]
   */
  load (markers, finished) {
    this.markers = markers
    this.markers.forEach((d, i) => {
      let theme = 'undefined'
      let texture = this.textures['undefined']
      // could be themes,
      // could be theme,
      // could be storyteller
      if (d.themes && d.themes[0] && d.themes[0].slug) {
        theme = d.themes[0].slug
        texture = this.textures[theme]
      }

      if (d.theme && d.theme.slug) {
        theme = d.theme.slug
        texture = this.textures[theme]
      }

      if (d.storyteller && d.storyteller.avatar && d.storyteller.avatar.img && d.storyteller.name) {
        console.log(d.storyteller.avatar)
        texture = (this.textures[d.storyteller.name]) ? this.textures[d.storyteller.name] : this.textures[d.storyteller.name] = new THREE.TextureLoader().load(d.storyteller.avatar.img.imgixHost + d.storyteller.avatar.img.value.path)
      }
      const themeColor = THEME_COLORS[theme]
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: new THREE.Color(themeColor)
      })

      const avatar = new THREE.Sprite(material)
      avatar.scale.set(0.5, 0.5, 0.5)
      // const avatar = new THREE.Sprite(material.clone())

      // latitude and longitude are mixed up in the data
      const lon = lon2phi(d.location.lng)
      const lat = lat2theta(d.location.lat)

      const {x, y, z} = polar2cartesian(SCALE * GLOBE_RADIUS, lat, lon)
      const position = new THREE.Vector3(x, y, z)

      avatar.position.x = position.x
      avatar.position.y = position.y
      avatar.position.z = position.z

      avatar.data = d
      avatar.themeColor = new THREE.Color(themeColor)

      this.mesh.add(avatar)
    })

    finished(this.mesh)
  }

  clear () {
    this.mesh.remove(...this.mesh.children)
    this.markers = []
  }
}
export default Avatar
