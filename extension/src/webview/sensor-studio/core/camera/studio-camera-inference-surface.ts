/**
 * Copy the live camera frame to a canvas for MediaPipe inference so we never
 * call detectForVideo on the same HTMLVideoElement that feeds VideoTexture /
 * CSS3D preview (avoids decode stalls and black flicker).
 */
const canvasByVideo = new WeakMap<HTMLVideoElement, HTMLCanvasElement>();

export function captureCameraInferenceCanvas(video: HTMLVideoElement): HTMLCanvasElement {
  let canvas = canvasByVideo.get(video);
  if (canvas == null) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;width:0;height:0;opacity:0;pointer-events:none;";
    document.body.appendChild(canvas);
    canvasByVideo.set(video, canvas);
  }

  const w = video.videoWidth > 0 ? video.videoWidth : 640;
  const h = video.videoHeight > 0 ? video.videoHeight : 480;
  if (canvas.width !== w) {
    canvas.width = w;
  }
  if (canvas.height !== h) {
    canvas.height = h;
  }

  const ctx = canvas.getContext("2d");
  if (ctx != null && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    ctx.drawImage(video, 0, 0, w, h);
  }

  return canvas;
}

export function releaseCameraInferenceCanvas(video: HTMLVideoElement): void {
  const canvas = canvasByVideo.get(video);
  if (canvas != null) {
    canvas.remove();
    canvasByVideo.delete(video);
  }
}
