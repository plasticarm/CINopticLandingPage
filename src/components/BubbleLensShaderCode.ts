export const bubbleLensCode = `
uniform sampler2D iChannel0;
uniform vec2 iResolution;
uniform float iTime;
uniform float opacity;
varying vec2 vUv;

#define NOISE_AMOUNT 0.01
#define M_PI 3.1415926535897932384626433832795

vec2 ProjectCoordsSphere(vec2 normCoords)
{
    const float SPHERE_RADIUS_SQ = 1.0;
    float z2 = SPHERE_RADIUS_SQ - dot(normCoords, normCoords);
    if(z2 <= 0.0)
        return normCoords;

    vec2 outProjectedCoords = normCoords / sqrt(z2);

    const float AA_EDGE = 0.2;
    if(z2 < AA_EDGE)
    {
        float aaFactor = smoothstep(0.0, 1.0, z2 / AA_EDGE);
        outProjectedCoords = mix(normCoords, outProjectedCoords, aaFactor);
    }
    
    return outProjectedCoords;
}

vec2 ProjectCoordsWave(vec2 normCoords)
{
    const float MAX_RADIUS = 1.0;
    float rad = sqrt(dot(normCoords, normCoords));
    if(rad > MAX_RADIUS)
        return normCoords;
    
    const float MIN_DEPTH = 0.4;
    const float WAVE_INV_FREQ = 20.0;
    const float WAVE_VEL = -10.0;
    float z = MIN_DEPTH + (MAX_RADIUS - MIN_DEPTH) * 0.5 * (1.0 + sin(WAVE_INV_FREQ * rad + iTime * WAVE_VEL));
    return normCoords / z;
}

vec2 ProjectCoordsLogLens(vec2 normCoords)
{
    float z = -log(dot(normCoords, normCoords));
    if(z <= 0.0)
        return normCoords;

    vec2 outProjectedCoords = normCoords / z;

    const float AA_EDGE = 0.2;
    if(z < AA_EDGE)
    {
        float aaFactor = smoothstep(0.0, 1.0, z / AA_EDGE);
        outProjectedCoords = mix(normCoords, outProjectedCoords, aaFactor);
    }
    
    return outProjectedCoords;
}

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = vUv;
    float aspect = iResolution.x / iResolution.y;
    
    // Procedural noise offset
    vec3 noise3 = vec3(hash(uv), hash(uv + 1.0), hash(uv + 2.0));   
    vec2 noiseOfs = (noise3.xy - 0.5) * NOISE_AMOUNT;
    
    vec2 cellMiddlePos = vec2(0.5, 0.5);
    vec2 cellDelta = (uv - cellMiddlePos) * 2.0;
    
    cellDelta.x *= aspect;
    
    // Apply the lens distortion
    cellDelta = ProjectCoordsSphere(cellDelta);
    
    cellDelta.x /= aspect;
    
    vec2 finalUv = cellMiddlePos + (cellDelta * 0.5) + noiseOfs;

    if (finalUv.x < 0.0 || finalUv.x > 1.0 || finalUv.y < 0.0 || finalUv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      vec4 texCol = texture2D(iChannel0, finalUv);
      gl_FragColor = vec4(texCol.rgb, texCol.a * opacity);
    }
}
`;
