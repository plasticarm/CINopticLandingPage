export const synapsesCode = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

#define rot(a) mat2(cos(a + vec4(0, 11, 33, 0)))
#define t iTime * .4

void mainImage(out vec4 o, vec2 u) {    
    vec2  r = iResolution.xy; o *= 0.;
          u = (u - r.xy / 2.) / r.y;
         
     float j, i, d, s, a, c, cyl, d1;
     
     while(i ++ < 160.){
        vec3 p = vec3(d * u * 1.8, d * 1.8) + vec3(-.1, .7, -.2);
        
        j = s = a = 8.45;
        
        while(j++ < 16.)
            c = dot (p, p),
            p /= c + .005,
            a /= c,
            
            p.xz = abs(
                       rot(sin(t - 1./c) / a - j) * p.xz
                   ) - .5,
           
            p.y = 1.78 - p.y,
            cyl = length(p.xz) * 2.5 - .06 / c,
            cyl = max(cyl, p.y) / a, 
            s = min(s, cyl) * .9;
        
        d += abs(s) + 1e-6;
        
        s < .001 ? o += .000001 / d*i  : o;
        
        if (cyl > length(p - vec3(0, sin(11.*t) ,0))-.5-.5*cos(7.*t)){
            s < .001 ? o += .000005 / d * i  : o;
            s < .02 ? o.b += .0002 / d  : o.b;
        }
     }
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
