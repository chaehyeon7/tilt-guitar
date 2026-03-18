// 기울기 감지 - 스트럼 트리거용
let onStrum = null;
let lastBeta = null;
let useMouse = false;
const STRUM_THRESHOLD = 15; // 기울기 변화량이 이 이상이면 스트럼

export function initTilt(callback) {
  onStrum = callback;

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(state => {
      if (state === 'granted') startDeviceOrientation();
      else startMouseFallback();
    }).catch(() => startMouseFallback());
  } else if ('DeviceOrientationEvent' in window) {
    startDeviceOrientation();
  } else {
    startMouseFallback();
  }
}

function startDeviceOrientation() {
  window.addEventListener('deviceorientation', (e) => {
    if (e.beta == null) return;
    const beta = Math.round(e.beta);
    if (lastBeta !== null) {
      const delta = beta - lastBeta;
      if (Math.abs(delta) > STRUM_THRESHOLD) {
        onStrum?.(delta > 0 ? 1 : -1, beta);
      }
    }
    lastBeta = beta;
  });
}

function startMouseFallback() {
  useMouse = true;
  // 마우스 폴백: 클릭으로 스트럼
  document.getElementById('fretboard').addEventListener('click', () => {
    onStrum?.(1, 0);
  });
}

export function isMouseMode() { return useMouse; }
