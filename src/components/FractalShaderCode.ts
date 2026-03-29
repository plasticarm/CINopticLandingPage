export const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

float zoom, ct;
#define THICKNESS .5 / iResolution.y

vec4 samp(vec2 p) {
    // center on limiting point and zoom
    p = (2. * p - iResolution.xy) / iResolution.y;
    p *= .5 * zoom;
    p += vec2(0.70062927, 0.9045085);
    
    // KIFS magic
    float s = zoom;
    p.x = abs(p.x);
    for (int i = 0; i < 16 + int(ct); i ++) {
        if (p.y - 1. > -.577 * p.x) {
            p.y --;
            p *= mat2(.809015, -1.401257, 1.401257, .809015);
            p.x = abs(p.x);
            s *= 1.618033;
        } else break;
    }
    
    // check if we are in le branch
    return vec4(min(step(p.x, s * THICKNESS), step(abs(p.y - .5), .5)));
}

void mainImage(out vec4 col, vec2 pos)
{
    ct = 6. * fract(.5 * iTime);
    zoom = pow(.618, ct);
    
    // sample
    col = samp(pos);
    col += samp(pos - vec2(.5, 0.));
    col += samp(pos + vec2(.5, 0.));
    col += samp(pos - vec2(0., .5));
    col += samp(pos + vec2(0., .5));
    col /= 5.;
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
