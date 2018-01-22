import * as THREE from 'three'
import Vue from 'vue'

export default {
  data () {
    return {
      renderer: null,
      camera: null,
      scene: null,
      message: ''
    }
  },
  props: {
    activeStory: {
      type: String,
      required: false
    }
  },
  mounted () {
    try {
      this.renderer = this.createRenderer()
      this.scene = this.createScene()
      this.camera = this.createCamera(this.scene)
      // resize the canvas
      this.handleResize()
      this.renderer.clear()
      this.renderer.render(this.scene, this.camera)
    } catch (err) {
      const fallbackElement = this.$el.querySelector('.fallback')
      fallbackElement.classList.remove('hidden')
    }

    // window is the event handler fo resize, so we need to subscribe to it
    window.addEventListener(
      'resize',
      this.handleResize
    )
  },
  computed: {
    containerSize: {
      get () {
        // lookup the size of the globe card element
        let size = [0, 0]
        if (this.globeContainerElement != null) {
          size = [this.globeContainerElement.clientWidth, this.globeContainerElement.clientHeight]
        }
        return size
      },
      cache: false

    },
    globeContainerElement: {
      // lookup the globe element
      get () {
        let el = this.$el
        return el
      },
      cache: false
    },
    globeElement: {
      // lookup the globe element
      get () {
        let el = null
        if (this.$el != null) {
          el = this.$el.querySelector('.globe')
        }
        return el
      },
      cache: false
    }

  },
  methods: {
    handleResize () {
      // We're getting the containerSize here because the size
      // of the canvas itself can is not changing on screen resize
      // reset the aspect ratio
      this.camera.aspect = this.containerSize[0] / this.containerSize[1]
      // recompute projection
      this.camera.updateProjectionMatrix()
      // set the size to the rederer
      this.renderer.setSize(this.containerSize[0], this.containerSize[1])
      // clear the screen
      this.renderer.clear()
      // redraw
      this.renderer.render(this.scene, this.camera)
    },
    pan () {
      console.log('panning to', this.activeStory)
    },
    /**
     * Create a renderer in the element
     * @returns {Renderer}
     */
    createRenderer () {
      const renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: true,
        autoClear: false
      })

      // append the globe canvas to our mounted element
      this.globeElement.appendChild(renderer.domElement)
      return renderer
    },

    /**
     * Create a scene
     * @returns {Scene} Scene with a sphere
     */
    createScene () {
      // minimal scene (TODO: append real globe)
      const scene = new THREE.Scene()

      const RADIUS = 5
      const sphereGeometry = new THREE.SphereGeometry(
        RADIUS, 32, 32
      )
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        opacity: 0.8,
        wireframe: true,
        transparent: true
      })

      const sphere = new THREE.Mesh(
        sphereGeometry,
        sphereMaterial
      )
      sphere.position.set(0, 0, 0)
      scene.add(sphere)
      // just a light to show the sphere
      const light = new THREE.DirectionalLight(0xffffff, 3.2)
      // from the side
      light.position.set(15, 0, 15)
      light.lookAt(sphere)
      scene.add(light)

      return scene
    },

    /**
     * Create a camera object that looks at the scene
     * @param {Scene} scene - scene (used to look at).
     * @returns {Camera} Camera, looking at the scene.
     */
    createCamera (scene) {
      const camera = new THREE.PerspectiveCamera(
        30, this.containerSize[0] / this.containerSize[1], 0.1, 300
      )
      camera.position.set(0, 20, 20)
      camera.lookAt(scene.position)
      return camera
    }
  }
}
