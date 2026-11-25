import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import mandapExteriorUrl from './assets/bonedi-puja-mandap.glb?url'
import mandapUrl from './assets/mandap-interior-reconstruction.glb?url'

type BonediSceneProps = {
  exploring: boolean
  onProgress: (progress: number) => void
  onJourneyProgress: (progress: number) => void
  onReady: () => void
  onError: () => void
}

export default function BonediScene({ exploring, onProgress, onJourneyProgress, onReady, onError }: BonediSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x171615)
    scene.fog = new THREE.Fog(0x171615, 34, 78)
    const camera = new THREE.PerspectiveCamera(36, 1, 0.08, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.16
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-label', '3D journey from the mandap entrance into the decorated interior. Use the 360 degree control to look around.')
    renderer.domElement.tabIndex = -1
    host.appendChild(renderer.domElement)

    const orbit = new OrbitControls(camera, renderer.domElement)
    orbit.enabled = false
    orbit.enablePan = false
    orbit.enableDamping = true
    orbit.dampingFactor = 0.08
    orbit.rotateSpeed = 0.55
    orbit.minPolarAngle = Math.PI * 0.22
    orbit.maxPolarAngle = Math.PI * 0.78

    scene.add(new THREE.HemisphereLight(0xe8e5dc, 0x292521, 2.1))
    const key = new THREE.DirectionalLight(0xffe2b4, 3.2)
    key.position.set(-5, 9, 8)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -9
    key.shadow.camera.right = 9
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -8
    key.shadow.bias = -0.00025
    scene.add(key)
    const fill = new THREE.PointLight(0xe5bd7c, 11, 20, 1.6)
    fill.position.set(0, -0.7, 1)
    scene.add(fill)
    const interior = new THREE.PointLight(0xffd99a, 18, 9, 1.5)
    interior.position.set(0, -1.55, -1.85)
    scene.add(interior)
    const rim = new THREE.DirectionalLight(0xc4c8ca, 1.35)
    rim.position.set(3, 5, -7)
    scene.add(rim)

    const exteriorRoot = new THREE.Group()
    const modelRoot = new THREE.Group()
    scene.add(exteriorRoot, modelRoot)
    let active = true
    let loaded = false
    let exteriorLoaded = false
    let interiorLoaded = false
    let frame = 0
    let progress = 0
    let cameraPath: THREE.CatmullRomCurve3 | null = null
    let targetPath: THREE.CatmullRomCurve3 | null = null
    let exteriorCameraPath: THREE.CatmullRomCurve3 | null = null
    let exteriorTargetPath: THREE.CatmullRomCurve3 | null = null
    let fittedModelSize = new THREE.Vector3(6.1, 7.7, 6.0)
    let exteriorFrontZ = 3.8
    let exteriorDepth = 3.4
    let frontFaceZ = -12
    let rearWallZ = 12
    const currentTarget = new THREE.Vector3()
    const desiredCamera = new THREE.Vector3()
    const desiredTarget = new THREE.Vector3()
    const exteriorEntryCamera = new THREE.Vector3()
    const exteriorEntryTarget = new THREE.Vector3()
    const interiorEntryCamera = new THREE.Vector3()
    const interiorEntryTarget = new THREE.Vector3()
    const openingEnd = 0.3
    const transitionEnd = 0.36

    const updateSceneVisibility = () => {
      if (!loaded) return
      exteriorRoot.visible = progress < openingEnd
      modelRoot.visible = progress >= openingEnd
    }

    const makePaths = () => {
      const width = host.clientWidth || innerWidth
      camera.aspect = width / Math.max(host.clientHeight, 1)
      camera.updateProjectionMatrix()
      // Blender's forward axis becomes negative Z in glTF: the doorway is at
      // maximum Z and the altar is at minimum Z.
      const entranceViewZ = frontFaceZ - 1.0
      const innerSanctumZ = rearWallZ + 5.4
      const middlePassageZ = THREE.MathUtils.lerp(entranceViewZ, innerSanctumZ, 0.58)
      const rearApproachZ = rearWallZ + 8.0
      const walkEyeY = -1.15
      cameraPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, walkEyeY, entranceViewZ),
        new THREE.Vector3(0, walkEyeY, middlePassageZ),
        new THREE.Vector3(0, walkEyeY, rearApproachZ),
        new THREE.Vector3(0, walkEyeY, innerSanctumZ),
      ])
      targetPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -1.45, Math.max(entranceViewZ - 12, rearWallZ + 0.6)),
        new THREE.Vector3(0, -1.45, Math.max(middlePassageZ - 10, rearWallZ + 0.6)),
        new THREE.Vector3(0, -1.45, Math.max(rearApproachZ - 7, rearWallZ + 0.6)),
        new THREE.Vector3(0, -1.45, rearWallZ + 0.6),
      ])
      cameraPath.getPoint(0, interiorEntryCamera)
      targetPath.getPoint(0, interiorEntryTarget)
      const exteriorStartZ = exteriorFrontZ + Math.max(10.5, fittedModelSize.y * 1.35)
      // Enter about 30% of the covered portal before changing to the nave.
      const exteriorDoorZ = exteriorFrontZ - Math.min(exteriorDepth * 0.3, 1.0)
      exteriorCameraPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.15, exteriorStartZ),
        new THREE.Vector3(0, -0.55, exteriorFrontZ + 0.35),
        new THREE.Vector3(0, -1.15, exteriorDoorZ),
      ])
      exteriorTargetPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.1, exteriorFrontZ - 0.3),
        new THREE.Vector3(0, -1.25, exteriorFrontZ - 4.0),
        interiorEntryTarget.clone(),
      ])
      exteriorCameraPath.getPoint(1, exteriorEntryCamera)
      exteriorTargetPath.getPoint(1, exteriorEntryTarget)
    }

    const updateCameraFromScroll = (delta = 0.12) => {
      if (!loaded || !cameraPath || !targetPath || !exteriorCameraPath || !exteriorTargetPath || orbit.enabled) return
      if (progress < openingEnd) {
        const t = progress / openingEnd
        exteriorCameraPath.getPoint(t, desiredCamera)
        exteriorTargetPath.getPoint(t, desiredTarget)
        camera.fov = THREE.MathUtils.lerp(44, 62, t)
      } else if (progress < transitionEnd) {
        const t = THREE.MathUtils.smoothstep(progress, openingEnd, transitionEnd)
        desiredCamera.copy(exteriorEntryCamera).lerp(interiorEntryCamera, t)
        desiredTarget.copy(exteriorEntryTarget).lerp(interiorEntryTarget, t)
        camera.fov = THREE.MathUtils.lerp(62, 62, t)
      } else {
        const t = THREE.MathUtils.clamp((progress - transitionEnd) / (1 - transitionEnd), 0, 1)
        cameraPath.getPoint(t, desiredCamera)
        targetPath.getPoint(t, desiredTarget)
        camera.fov = 62
      }
      camera.fov = (host.clientWidth || innerWidth) < 650 ? Math.max(camera.fov, 66) : camera.fov
      camera.updateProjectionMatrix()
      camera.position.lerp(desiredCamera, delta)
      currentTarget.lerp(desiredTarget, delta)
      camera.lookAt(currentTarget)
    }

    const readProgress = () => {
      const track = document.querySelector<HTMLElement>('.journey-track')
      if (!track) return
      const span = track.offsetHeight - innerHeight
      const rawProgress = span > 0
        ? THREE.MathUtils.clamp((scrollY - track.offsetTop) / span, 0, 1)
        : 0
      progress = rawProgress
      onJourneyProgress(rawProgress)
      updateSceneVisibility()
    }

    const onExploreMode = (event: Event) => {
      const enabled = (event as CustomEvent<boolean>).detail
      orbit.enabled = enabled
      renderer.domElement.style.touchAction = enabled ? 'none' : 'pan-y'
      renderer.domElement.tabIndex = enabled ? 0 : -1
      if (enabled) {
        orbit.target.copy(currentTarget)
        orbit.minDistance = Math.max(fittedModelSize.y * 0.28, 0.8)
        orbit.maxDistance = Math.max(fittedModelSize.y * 1.5, 10)
        orbit.update()
        orbit.listenToKeyEvents(renderer.domElement)
        renderer.domElement.focus({ preventScroll: true })
      } else {
        orbit.stopListenToKeyEvents()
      }
    }
    window.addEventListener('pujo:explore-mode', onExploreMode)

    let exteriorPercent = 0
    let interiorPercent = 0
    const reportProgress = () => onProgress(exteriorPercent * 0.8 + interiorPercent * 0.2)
    const finishWhenReady = () => {
      if (!active || !exteriorLoaded || !interiorLoaded || loaded) return
      const doorwayOffset = frontFaceZ - exteriorFrontZ
      exteriorRoot.position.z += doorwayOffset
      exteriorFrontZ += doorwayOffset
      loaded = true
      makePaths()
      updateSceneVisibility()
      updateCameraFromScroll(1)
      orbit.target.copy(currentTarget)
      onProgress(100)
      onReady()
    }
    const prepareModel = (model: THREE.Group, root: THREE.Group) => {
      const bounds = new THREE.Box3().setFromObject(model)
      const size = bounds.getSize(new THREE.Vector3())
      const scale = 7.7 / size.y
      const center = bounds.getCenter(new THREE.Vector3()).multiplyScalar(scale)
      model.scale.setScalar(scale)
      model.position.sub(center)
      root.add(model)
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.castShadow = true
        object.receiveShadow = true
      })
      return new THREE.Box3().setFromObject(model)
    }

    const loader = new GLTFLoader()
    loader.load(mandapExteriorUrl, ({ scene: model }) => {
      if (!active) return
      const bounds = prepareModel(model, exteriorRoot)
      exteriorFrontZ = bounds.max.z
      exteriorDepth = bounds.getSize(new THREE.Vector3()).z
      exteriorLoaded = true
      exteriorPercent = 100
      reportProgress()
      finishWhenReady()
    }, (event) => {
      if (event.total > 0) {
        exteriorPercent = (event.loaded / event.total) * 100
        reportProgress()
      }
    }, (error) => {
      console.error('Unable to load the mandap entrance model.', error)
      exteriorLoaded = true
      exteriorRoot.visible = false
      finishWhenReady()
    })

    loader.load(mandapUrl, ({ scene: model }) => {
      if (!active) return
      const bounds = prepareModel(model, modelRoot)
      fittedModelSize.copy(bounds.getSize(new THREE.Vector3()))
      frontFaceZ = bounds.max.z
      rearWallZ = bounds.min.z
      interiorLoaded = true
      interiorPercent = 100
      reportProgress()
      finishWhenReady()
    }, (event) => {
      if (event.total > 0) {
        interiorPercent = (event.loaded / event.total) * 100
        reportProgress()
      }
    }, (error) => {
      console.error('Unable to load the Bonedi Bari interior model.', error)
      onError()
    })

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      renderer.setSize(width, height, false)
      if (loaded) {
        makePaths()
        updateCameraFromScroll(1)
      }
    }

    const animate = () => {
      updateCameraFromScroll()
      if (orbit.enabled) orbit.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    readProgress()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', readProgress, { passive: true })
    renderer.domElement.style.touchAction = 'pan-y'
    frame = requestAnimationFrame(animate)

    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', readProgress)
      window.removeEventListener('pujo:explore-mode', onExploreMode)
      orbit.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pujo:explore-mode', { detail: exploring }))
  }, [exploring])

  return <div className="bonedi-scene" ref={hostRef} aria-label="Interactive 3D journey from the mandap entrance into its interior" />
}
