export const cosmicEnergyCode = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
}


float hash( float n ){
    return fract(sin(n)*758.5453);
}

 float configurablenoise(vec3 x, float c1, float c2) {
	vec3 p = floor(x);
	vec3 f = fract(x);
	f       = f*f*(3.0-2.0*f);

	float h2 = c1;
	 float h1 = c2;
	#define h3 (h2 + h1)

	 float n = p.x + p.y*h1+ h2*p.z;
	return mix(mix(	mix( hash(n+0.0), hash(n+1.0),f.x),
			mix( hash(n+h1), hash(n+h1+1.0),f.x),f.y),
		   mix(	mix( hash(n+h2), hash(n+h2+1.0),f.x),
			mix( hash(n+h3), hash(n+h3+1.0),f.x),f.y),f.z);

}

float supernoise3dX(vec3 p){

	float a =  configurablenoise(p, 883.0, 971.0);
	float b =  configurablenoise(p + 0.5, 113.0, 157.0);
	return (a * b);
}

float fbmHI2d(vec2 p, float dx){
   // p *= 0.1;
    p *= 0.2;
	//p += getWind(p * 0.2) * 6.0;
	float a = 0.0;
    float w = 1.0;
    float wc = 0.0;
	for(int i=0;i<5;i++){
        //p += noise(vec3(a));
		a += clamp(2.0 * abs(0.5 - (supernoise3dX(vec3(p, 1.0)))) * w, 0.0, 1.0);
		wc += w;
        w *= 0.5;
		p = p * dx;
	}
	return a / wc;// + noise(p * 100.0) * 11;
}

float stars(vec2 seed, float intensity){
	return smoothstep(1.0 - intensity*0.9, (1.0 - intensity *0.9)+0.1, supernoise3dX(vec3(seed * 500.0, 0.0)) * (0.8 + 0.2 * supernoise3dX(vec3(seed * 40.0, 0.0))));
}
vec3 stars(vec2 uv){
	float intensityred = (1.0 / (1.0 + 30.0 * abs(uv.y))) * fbmHI2d(uv * 30.0, 3.0) * (1.0 - abs(uv.x ));	
	float intensitywhite = (1.0 / (1.0 + 20.0 * abs(uv.y))) * fbmHI2d(uv * 30.0 + 120.0, 3.0) * (1.0 - abs(uv.x ));	
	float intensityblue = (1.0 / (1.0 + 20.0 * abs(uv.y))) * fbmHI2d(uv * 30.0 + 220.0, 3.0) * (1.0 - abs(uv.x ));	
	float galaxydust = smoothstep(0.1, 0.5, (1.0 / (1.0 + 20.0 * abs(uv.y))) * fbmHI2d(uv * 20.0 + 220.0, 3.0) * (1.0 - abs(uv.x )));	
	float galaxydust2 = smoothstep(0.2, 0.5, (1.0 / (1.0 + 20.0 * abs(uv.y))) * fbmHI2d(uv * 50.0 + 220.0, 3.0) * (1.0 - abs(uv.x )));	
	intensityred = 1.0 - pow(1.0 - intensityred, 3.0) * 0.73;
	intensitywhite = 1.0 - pow(1.0 - intensitywhite, 3.0) * 0.73;
	intensityblue = 1.0 - pow(1.0 - intensityblue, 3.0) * 0.73;
	float redlights = stars(uv, intensityred );
	float whitelights = stars(uv, intensitywhite );
	float bluelights = stars(uv, intensityblue );
	vec3 starscolor = vec3(1.0, 0.8, 0.5) * redlights + vec3(1.0) * whitelights + vec3(0.6, 0.7, 1.0) * bluelights;
	vec3 dustinner = vec3(0.9, 0.8, 0.8);
	vec3 dustouter = vec3(0.2, 0.1, 1.0);
	vec3 innermix = mix(dustinner, starscolor, 1.0 - galaxydust);
	vec3 allmix = mix(dustouter, innermix, 1.0 - galaxydust2);
	vec3 bloom = 5.6 * dustinner * (1.0 / (1.0 + 30.0 * abs(uv.x))) * fbmHI2d(uv * 3.0, 3.0) * (1.0 - abs(uv.x ));	
	return allmix + bloom;
}

vec3 milkyway(vec2 uv){
	return stars(uv);
}
#define resolution iResolution.xy
#define time iTime
#define PI 3.141592
#define TWOPI 6.283184

#define R2D 180.0/PI*
#define D2R PI/180.0* 

mat2 rotMat(in float r){float c = cos(r);float s = sin(r);return mat2(c,-s,s,c);}

//fract -> -0.5 -> ABS  : coordinate absolute Looping
float abs1d(in float x){return abs(fract(x)-0.5);}
vec2 abs2d(in vec2 v){return abs(fract(v)-0.5);}
float cos1d(float p){ return cos(p*TWOPI)*0.25+0.25;}
float sin1d(float p){ return sin(p*TWOPI)*0.25+0.25;}

#define OC 15.0
vec3 Oilnoise(in vec2 pos, in vec3 RGB)
{
    vec2 q = vec2(0.0);
    float result = 0.0;
    
    float s = 2.2;
    float gain = 0.44;
    vec2 aPos = abs2d(pos)*0.5;//add pos

    for(float i = 0.0; i < OC; i++)
    {
        pos *= rotMat(D2R 30.);
        float time = (sin(iTime)*0.5+0.5)*0.2+iTime*0.8;
        q =  pos * s + time;
        q =  pos * s + aPos + time;
        q = vec2(cos(q));

        result += sin1d(dot(q, vec2(0.3))) * gain;

        s *= 1.07;
        aPos += cos(smoothstep(0.0,0.15,q));
        aPos*= rotMat(D2R 5.0);
        aPos*= 1.232; 
    }
    
    result = pow(result,4.504);
    return clamp( RGB / abs1d(dot(q, vec2(-0.240,0.000)))*.5 / result, vec3(0.0), vec3(1.0));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv *= .8;


	float v1, v2, v3;
	v1 = v2 = v3 = 0.0;
vec2 r = resolution;
	float t2 = time;
	fragColor=vec4(.1);
	vec3 d=vec3((2.*fragCoord.xy-r)/r.y,1.);
	  vec3 col2 = vec3(0.0,0.0,0.0);
    vec2 st = (fragCoord/iResolution.xy);
            st.x = ((st.x - 0.5) *(iResolution.x / iResolution.y)) + 0.5;
    float stMask = step(0.0, st.x * (1.0-st.x));



    vec3 rgb = vec3(0.30, .8, 1.200);
    
    
    //berelium, 2024-06-07 - anti-aliasing
    float AA = 1.0;
    vec2 pix = 1.0 / iResolution.xy;
    vec2 aaST = vec2(0.0);
    
    for(float i = 0.0; i < AA; i++) 
    {
        for(float j = 0.0; j < AA; j++) 
        {
            aaST = st + pix * vec2( (i+0.1)/AA, (j+0.5)/AA );
            col2 += Oilnoise(aaST, rgb);
        }
    
    }
    
    col2 /= AA * AA;
	float s = 0.0;
	for (int i = 0; i < 140; i++)
	{
		vec3 p = s * vec3(uv,col2.x);

		p += vec3(.22, .3, s - 1.5 - sin(iTime * .13) * .1)*col2;
		for (int i = 0; i < 8; i++)	p = abs(p) / dot(p,p) - 0.659;
		v1 += dot(p,p) * .0015 * (1.8 + sin(length(uv.xy * 13.0) + .5  - iTime * .2));
		v2 += dot(p,p) * .0013 * (1.5 + sin(length(uv.xy * 14.5) + 1.2 - iTime * .3));
		v3 += length(p.xy*10.) * .0003;
		s  += .035;
	}
	
	float len = length(uv);
	
   
    
    
	vec3 col = vec3( v3 * (1.5 + sin(iTime * .2) * .4),
					(v1 + v3) * .3,
					 v2) + smoothstep(0.2, .0, len) * .85 + smoothstep(.0, .6, v3) * .3* col2;


	vec2 pos = (rotationMatrix(vec3(0.0, 0.0, 1.0), 0.2415) * vec3(uv.x, uv.y, 0.0)).xy;
	fragColor = vec4(milkyway(pos)*col.xyz,1.0);
    for(float i=0.;i<200.;i++){
		vec3 p=(
			abs(
				fract(fract(99.*sin((vec3(1,5,9)+i*9.)))+t2*.1002)*2.-1.
			)*2.-1.
		)*30.;
    
		fragColor+=vec4(
			mix(vec3(1),(cos((vec3(0,2,-2)*col2/3.+i*.01)*11.283)*.5+.5),.8)
			*exp(-3.*length(cross(p,d))),
			1
		);	
        }
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
