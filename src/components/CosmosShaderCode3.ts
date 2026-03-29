export const cosmosCode3 = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

#define T iTime
#define PI 3.141596
#define S smoothstep
const float EPSILON = 1e-6;

mat2 rotate(float a){
  float s = sin(a);
  float c = cos(a);
  return mat2(c,-s,s,c);
}

vec3 path(float v){
  return vec3(cos(v*.2+sin(v*.1)*2.)*3.,
              sin(v*.2+cos(v*.3)   )*3., v);
}

// hash function https://www.shadertoy.com/view/4djSRW
vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}
float hash13(vec3 p3){
  return fract(dot(p3, cos(p3.yzx)));
}
float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float fbm(vec3 p){
  float amp = 1.;
  float fre = 1.;
  float n = 0.;
  for(float i=0.;i<5.;i++){
    n += amp*abs(dot(cos(p*fre), vec3(.06)));
    amp *= .5;
    fre *= 2.;
  }
  return n;
}

void mainImage(out vec4 O, in vec2 I){
  vec2 R = iResolution.xy;
  vec2 uv = (I*2.-R)/R.y;
  vec2 m = iMouse.xy/R * 5.;

  O.rgb *= 0.;
  O.a = 1.;

  float t = T*2.;
  vec3 ro = path(t);
  vec3 ta = path(t+1.);
  vec3 front = normalize(ta - ro);
  vec3 up = vec3(0,1,0);
  vec3 right = normalize(cross(front, up));
  vec3 rd = mat3(right, up, front) * normalize(vec3(uv, 1.));

  float zMax = 50.;
  float z = .1;

  vec3 col = vec3(0.0);
  for(float i=0.;i<100.;i++){
    vec3 p = ro + rd * z;

    if(iMouse.x>0.){
      p.xz *= rotate(m.x);
      p.yz *= rotate(m.y);
    }

    // repetate star
    vec3 q = p;
    q.z += t*3.;
    float s = 4.;
    vec3 id = floor(q/s + 0.5);
    q -= id*s;
    float d = 1e20;
    {
        vec3 pos = hash33(id)*(s/2.)-(s/4.);
        float d1 = length(q-pos) - .06 + hash13(id+T*1e-3)*.2;
        d = min( d, d1);
        d = max(0., d);
    }

    // cave
    float d1 = length(p.xy-path(p.z).xy)-3.;
    d1 = abs(d1)+.01;
    d1 += fbm(p*2.+t*2.);
    d = min(d, d1);
    d = d * (1.-hash12(uv.xy*100.+T)*.2);

    float k = sin(p.z+p.x*.5+p.y*.3)*.5+.5;

    col += k * (1.1+sin(vec3(3.0,2.0,1.0)+p.x+p.z+hash13(id)))/d;

    if(d<EPSILON || z>zMax) break;
    z += d;
  }

  // col = tanh(col / 1e2); // tanh is not available in GLSL ES 1.0, replacing with equivalent
  vec3 e = exp(2.0 * (col / 1e2));
  col = (e - 1.0) / (e + 1.0);

  O.rgb = col;
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
