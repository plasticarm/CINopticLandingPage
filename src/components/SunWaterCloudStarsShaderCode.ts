export const sunWaterCloudStarsCode = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

void mainImage(out vec4 fragColor, in vec2 fragCoord) 
{
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float depth = 0.0;
    fragColor = vec4(0.0);
    for (int stepCount = 0; stepCount < 100; stepCount += 1) 
    {
        vec3 position = vec3(uv * depth, depth + iTime);
        for (float octave = .05; octave < 1.0; octave += octave) 
        {
            position += 0.1 * cos(position.z + position.yzx * 0.02);
            float noise = dot(sin(iTime*(uv.y>0.?.02:2.) + position.z + position * octave * 16.0 *(uv.y>0.?.3:1.)  ),vec3(0.01));
            position += abs(noise) / octave;
        }
        float val = 0.03 + abs(2.0 - abs(position.y)) * 0.2;
        depth += val;
        fragColor += vec4(1.0 / val);
    }
    vec4 skycolor = pow(vec4(4.0, 2.3, 1.0, 0.0), vec4(1.5));
    vec4 watercolor = vec4(1.0, 2.3, 6.0, 0.0);
    float blendFactor = smoothstep(0.2, -0.5, uv.y);
    vec4 save= fragColor;
    fragColor *= mix(skycolor, watercolor, blendFactor);
    float t = iTime/5.;
    float sunpos = max(0.,sin(t)/2.);
    vec2 sun = uv - vec2(-cos(t), sunpos);
    fragColor = tanh(fragColor / 6000.0 / ((1./(
      smoothstep(.03*sin(iTime+uv.x*5.),-.06,uv.y)*.3
      +sunpos))*pow(length(sun),sunpos*4.)) );
    bool stars = abs(1.-2.*fract( 23.2346 * fract( dot(uv+uv*uv,vec2(312.1315,4982.35))) ) )  > .999; // need better loopless stars golf
    fragColor = mix( fragColor, vec4(stars), 
      uv.y < 0. ? 0. : .5-sunpos );
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
