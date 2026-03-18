// 기울기 감지 (DeviceOrientation + 마우스 폴백)
let onTiltChange = null;
let useMouse = false;

export function initTilt(callback) {
  onTiltChange = callback;

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
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
    // beta: 앞뒤 기울기 (-180~180), gamma: 좌우 (-90~90)
    const angle = e.beta != null ? Math.max(-90, Math.min(90, e.beta)) : 0;
    if (onTiltChange) onTiltChange(angle);
  });
}

function startMouseFallback() {
  useMouse = true;
  document.addEventListener('mousemove', (e) => {
    // 화면 Y좌표 → -90 ~ 90도 매핑
    const angle = ((e.clientY / window.innerHeight) * 180) - 90;
    if (onTiltChange) onTiltChange(angle);
  });
}

export function isMouseMode() { return useMouse; }
