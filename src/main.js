import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Renderer
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth * 0.75, window.innerHeight);

// Scena
const scene = new THREE.Scene();

// Sfondo (riempie, potrebbe “stirare” in resize; semplice e leggero)
const textureLoader = new THREE.TextureLoader();
textureLoader.load("/src/assets/sfondo.jpg", (tex) => {
  scene.background = tex;
});

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  (window.innerWidth * 0.75) / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

// Luci
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Modello GLB con animazione con pause (loop: 1 volta + pausa 2s)
const loader = new GLTFLoader();
let mixer = null;

loader.load("/src/assets/Personaggio.glb", (gltf) => {
  const model = gltf.scene;
  model.position.set(-0.2, -1, 0);
  model.scale.set(1.6, 1.6, 1.6);
  scene.add(model);

  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const clip = gltf.animations[0];
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1); // Impostato loop solo una volta
    action.clampWhenFinished = true;
    action.play();

    mixer.addEventListener("finished", () => {
      setTimeout(() => {
        action.reset();
        action.play(); // Riparte l'animazione
      }, 2000);  // Pausa ridotta a 2000ms (2 secondi)
    });
  }
});

// Loop render
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(clock.getDelta());
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = (window.innerWidth * 0.75) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth * 0.75, window.innerHeight);
});
