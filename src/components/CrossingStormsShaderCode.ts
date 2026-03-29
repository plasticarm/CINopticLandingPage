export const crossingStormsCode = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

mat2 R(float q){return mat2(cos(q),sin(q),-sin(q),cos(q));}

void mainImage(out vec4 O,in vec2 C) {
    O*=0.; vec2 r=iResolution.xy, uv=C/r;
    float t=iTime,i,e,s,g,k=.01;
    for(O++;i++<99.;g+=max(k,e*.2)){
        vec3 p=vec3((C-.6*r)/r.y*g+r/r*R(t+g*.5)*.5,g+t/.3);e=.3-dot(p.xy,p.xy);
        for (s=2.;s<200.;s/=.6) {p.yz*=R(s);e+=abs(dot(sin(p*s+t*s*.2)/s,p-p+1.));}
        O+=O.w*min(e*O+(sin(vec4(1.,2.,3.,1.)-p.z*.3)*.6-.4),k)*k;} 
    O*=min(1.,1.+cos(.15*t))+min(1.,max(0.,-2.-4.*cos(.15*t)))*smoothstep(.85, 1.,fract(sin(t)*43758.5453));
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
