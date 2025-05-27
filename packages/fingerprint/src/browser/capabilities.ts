function hasWebPSupport(): boolean {
  const elem = document.createElement('canvas');
  if (elem.getContext?.('2d')) {
    return elem.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return false;
}
let cache: Record<string, boolean | number> | undefined = undefined;
const capabilities = () => {
  if (cache) return cache;
  cache = {
    serviceWorker: 'serviceWorker' in navigator,
    webWorker: 'Worker' in window,
    webSocket: 'WebSocket' in window,
    webRTC: 'RTCPeerConnection' in window,
    webGL: 'WebGLRenderingContext' in window,
    webP: hasWebPSupport(),
    webAssembly: 'WebAssembly' in window,
    webShare: 'share' in navigator,
    webNFC: 'NDEFReader' in window,
    webUSB: 'USB' in navigator,
    webBluetooth: 'bluetooth' in navigator,
    webMIDI: 'requestMIDIAccess' in navigator,
    webAuthentication: 'credentials' in navigator,
    webPayments: 'PaymentRequest' in window,
    webSpeech: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    performance: 'performance' in window,
    memoryInfo: 'memory' in performance,
    deviceMemory: 'deviceMemory' in navigator,
    hardwareConcurrency: navigator.hardwareConcurrency,
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    indexedDB: 'indexedDB' in window,
    cacheAPI: 'caches' in window,
    mediaDevices: 'mediaDevices' in navigator,
    mediaSession: 'mediaSession' in navigator,
    mediaCapabilities: 'mediaCapabilities' in navigator,
    secureContext: window.isSecureContext,
    crossOriginIsolated: window.crossOriginIsolated,
    permissions: 'permissions' in navigator,
  };
  return cache;
};

export default capabilities;
