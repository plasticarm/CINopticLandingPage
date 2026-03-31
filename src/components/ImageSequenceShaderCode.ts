export const imageSequenceCode = `
uniform sampler2D iChannel0;
uniform vec2 iResolution;
varying vec2 vUv;

void main() {
  // Assume a 16:9 default aspect ratio for the sequence
  vec2 imgRes = vec2(16.0, 9.0);
  vec2 screenRes = iResolution.xy;
  
  float screenAspect = screenRes.x / screenRes.y;
  float imgAspect = imgRes.x / imgRes.y;
  
  vec2 uv = vUv;
  
  if (screenAspect > imgAspect) {
    // Screen is wider than image
    float scale = screenAspect / imgAspect;
    uv.y = (uv.y - 0.5) / scale + 0.5;
  } else {
    // Screen is taller than image
    float scale = imgAspect / screenAspect;
    uv.x = (uv.x - 0.5) / scale + 0.5;
  }
  
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    vec4 texColor = texture2D(iChannel0, uv);
    gl_FragColor = texColor;
  }
}
`;
