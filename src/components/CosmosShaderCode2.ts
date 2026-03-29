export const cosmosCode2 = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
varying vec2 vUv;

#define PI 3.14159265
#define TWO_PI 6.2831853
#define USE_PROCEDURAL 
#define ANIMATE
//#define AUDIOPULSE
#define MOUSEZOOM
float zoom = 1.0;
float inv_zoom = 1.0;

vec2 rotate( const in vec2 vPos, const in float fAngle )
{
    float s = sin(fAngle);
    float c = cos(fAngle);

    vec2 vResult = vec2( c * vPos.x + s * vPos.y, -s * vPos.x + c * vPos.y);

    return vResult;
}

vec2 rotate_around( const in vec2 vPos, const in vec2 vCentre, const in float fAngle )
{
    return rotate(vPos - vCentre, fAngle) + vCentre;
}

vec2 RadialDistort(vec2 uv ,vec2 centre, float radius, float amount, float r)
{
    vec2 lpos = uv - centre;
    float dist = length(lpos);
    float dx = dist / radius;
    vec2 ret = rotate(lpos, r + (dx * amount));
    return ret + centre;
}

float CircularGradient(vec2 pos, vec2 centre, float radius)
{
    float dist = length(pos - centre);
    float dx = dist / radius;
  
    return dx;
}


float CircularGradientSineSeg(vec2 pos, vec2 centre, float radius, float segments)
{
    vec2 vec = (pos - centre);
    float dist = length(vec);
    vec2 norm = vec / dist;
    float segment = max(0.0, sin(atan(-norm.y, norm.x) * segments));
    float dx = 1.0 - (dist / radius);
  
    return dx * segment;
}


float SelectSegment(const in vec2 vPos, const in float segcount)
{
	
	vec2 vNorm = normalize(vPos);
	float atn = (atan(vNorm.y, vNorm.x) + PI)/  TWO_PI;
	float segment = floor(atn * segcount);
	float half_segment = 0.5 / segcount;
	float seg_norm = mod((segment / segcount) + 0.25 + half_segment, 1.0);
	
	return seg_norm * TWO_PI;//turn it back in to rotation
}

float StarShapeBW(vec2 pos, vec2 centre, float centrerad, float radius, float segments)
{
    vec2 vec = (pos - centre);
    float dist = length(vec);
    float angle = atan(-vec.y, vec.x);
    float seg_angle_size = TWO_PI / segments;
    float half_seg_seg_angle_size = seg_angle_size * 0.5;
    float seg_arc_length = seg_angle_size * centrerad;
    //float nrm_mul = 1.0
    
    if (dist < centrerad)
        return 1.0;
    else if (dist > radius)
        return 0.0;
    else
    {
        float r =  SelectSegment(vec, segments);		
		vec2 dpos = rotate(vec, r );        
        float ld = 1.0 - (dist - centrerad) / (radius - centrerad);
        float w = mod(angle, seg_angle_size);
        float d = abs(dpos.x);
        float width_at = seg_angle_size * ld;
        return (d < seg_arc_length * 0.5 * ld) ? 1.0 : 0.0;
    }
}



float StarShape2(vec2 pos, vec2 centre, float centrerad, float radius, float segments)
{
    vec2 vec = (pos - centre);
    float dist = length(vec);
    float angle = atan(-vec.y, vec.x);
    float seg_arc_length = TWO_PI / segments;
    float half_seg_arc_length = seg_arc_length * 0.5;
    if (dist < centrerad)
        return 1.0;
    else 
    {
        float ld = 1.0 - (dist - centrerad) / (radius - centrerad);
        float w = mod(angle, seg_arc_length);
        float d =  abs(w - half_seg_arc_length) * 1.0/ half_seg_arc_length;
        return pow(d * 1.0, ld) * ( ld);
    }
}

float easeInOutQuart(float t) 
{
	if ((t/=0.5) < 1.0) return 0.5*t*t*t*t;
	return -0.5 * ((t-=2.0)*t*t*t - 2.0);
}
float easeOutCubic(float t) 
{
	return ((t=(t/1.0)-1.0)*t*t + 1.0);
}
float easeInOutCubic(float t) 
{
	if ((t/=0.5) < 1.0) return 0.5*t*t*t;
	return 0.5*((t-=2.0)*t*t + 2.0);
}

float fade2(float t)
{
	return t*t*(3.0-2.0*t);
}
 

float fade(float t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

vec3 fadeVec3(vec3 t) 
{
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float fade3(float f)
{
    return f*f*(3.0-2.0*f);
}

vec3 fade3Vec3(vec3 f)
{
    return f*f*(3.0-2.0*f);
}


#ifdef USE_PROCEDURAL
float hash( float n ) { return fract(sin(n)*43758.5453123); }


float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = fadeVec3(f);//f*f*(3.0-2.0*f);
	
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

#else


float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = fade3Vec3(f);
	
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	vec2 rg = vec2(0.0); // texture( iChannel0, (uv+0.5)/256.0, -100.0 ).yx;
	return mix( rg.x, rg.y, f.z );
}


#endif


float multiNoise( in vec3 pos )
{
    vec3 q = 8.0*pos;
    const mat3 m = mat3( 0.00,  0.80,  0.60,
                    -0.80,  0.36, -0.48,
                    -0.60, -0.48,  0.64 );
    float amplitude = 0.5;
    float f  = amplitude*noise( q ); q = m*q*2.01;
    float scale = 2.02;
    float amptotal = 0.0;
    for (int i = 0; i < 10; ++i)
    {    
    	f += amplitude * noise( q ); q = m*q*scale;        
        amplitude *= 0.65;
        
    }
    f /= 1.7;
    	//  f += 0.0312*noise( q ); q = m*q*1.05;
 
    return f;
}

vec3 orangegrad(float d)
{
    vec3 col1 = mix(vec3(0.0, 0.0, 0.0), vec3(2.0, 0.7, 0.1), d);
    
    return mix(col1, vec3(5.0, 2.0, 0.1), d * 0.1);
}


vec3 bluegrad(float d)
{
    return mix(mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.7, 0.8), d), vec3(3.0, 7.0, 12.0), d * 0.1);
}

vec2 hash2( vec2 p )
{
	// texture based white noise
	return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 blackbody_grad(float x)
{    
    float ca = 1.0 - (pow(x, 1.5) * 0.5);
    float cb = pow(min(1.0, x +0.6), 3.0) * 0.9;
    float cd = x * 0.4;
    float g = cb- cd;    	
    return vec3(ca * 1.1,g*1.0,(1.0- ca) * 1.3) * 1.2;
}

vec4 hash4( vec2 p)
{
    return vec4(hash2(p), hash2(p + vec2(100.0)));
}

float star_falloff(float dist, float radius)
{
    float idist = max(0.0, radius - dist);
    return pow(idist, 70.0) * 3.0 + pow(idist, 10.0) * 0.8;
}

float star_falloff2(float dist, float radius)
{
    float idist = max(0.0, radius - dist);
    return pow(idist, 270.0) * 0.3 + pow(idist, 270.0) * 1.8;
}

//IQ's voronoi code provided the inspiration for this, thank you.
vec3 voronoi_stars( in vec2 pos)
{
    vec2 n = floor(pos);
    vec2 f = fract(pos);

   
	vec2 min_cell, min_pos;

    float min_dist = 100.0;
    vec3 col = vec3(0,0,0);
    int xdir = f.x > 0.5 ? 1 : -1;
    int ydir = f.y > 0.5 ? 1 : -1;
    for( int j=0; j<=1; j++ )
    {
   		for( int i=0; i<=1; i++ )    
	    {
    	    vec2 cell = vec2(float(i * xdir),float(j * ydir)); //integer cell offset
			vec2 o = hash2( n + cell );		  //hashed up random offseterizer
			#ifdef ANIMATE
        	o = 0.5 + 0.5*sin( iTime * 0.3 + 6.2831*o );
        	#endif	
        	vec2 r = cell + o - f;        
        	vec4 stardata = hash4(n + cell);
        	#define SQRT_DIST
        	#ifdef SQRT_DIST
        	float d = length(r);                
        	float starfo = star_falloff(d, 1.0) * 2.0;
        	#else // faster
        	float d = dot(r,r);                
        	float starfo = star_falloff2(d, 1.0) * 2.0;
        	#endif
      
	        vec3 star_colour = blackbody_grad(stardata.x * 1.4 )  * stardata.w * starfo;
			col += star_colour;
        }
    }
    return col;
}

float SphereShape(vec2 pos, vec2 centre, float radius, float curvep, float brightness)
{
    vec2 vec = (pos - centre);
    float dist = length(vec);
    if (dist > radius) return 0.0;
    return min(1.0,max(0.0, pow(1.0 - (dist / radius), curvep))) * brightness;   
}

vec4 Galaxy(vec2 pos, vec2 centre, float centrerad, float radius, float twist_amount, float rotation, float segments)
{
    vec2 rpos = RadialDistort(pos, centre, radius, twist_amount, rotation);
    vec2 rposless = RadialDistort(pos, centre, radius, twist_amount * 0.1, rotation);
    
    vec2 vec = rotate((rpos - centre), rotation);
    
    vec2 vecless = (rposless - centre);
    float dist = length(vec);
    float angle = atan(-vec.y, vec.x);
    float seg_angle_size = TWO_PI / segments;
    float half_seg_seg_angle_size = seg_angle_size * 0.5;
    float seg_arc_length = seg_angle_size * centrerad;
    float seg_arc_end_length = seg_arc_length * 0.2;
   
    float ns = multiNoise(vec3(pos.x * 1.0, pos.y * 1.0, iTime*0.005));
    float nst = multiNoise(vec3(rposless.x * 3.0, rposless.y * 3.0, iTime*0.0016));
    ns = mix(ns, nst, 0.5);
        
    if (dist > radius)
        return vec4(0.0, 0.0, 0.0, 0.0);
    else
    {
      
        
        float r =  SelectSegment(vec, segments);		
		vec2 dpos = rotate(vec, r );        
        float yd = 1.0 - (dist - centrerad) / (radius - centrerad);
        
        float fadeout = pow(yd, 5.3) *0.4;
        float w = mod(angle, seg_angle_size);
      
        float centre_fo =  1.0;//max(0.0, 1.0 - pow(yd, 30.1));
         vec2 dposless = rotate(vecless, r );        
     
        float thread = 1.0 - max(0.0, abs(dpos.x  + ((ns - 0.5)* 0.4 * centre_fo)));
        float d =  abs(dpos.x ) ;
             
        float width_at = seg_arc_end_length+(seg_arc_length - seg_arc_end_length * yd);
        
        float xd = clamp((width_at-d) / seg_arc_length, 0.0, 1.0);
        
        float fadexd = (pow(fade2(xd), 1.2) * 1.2) * ns;
        return vec4( fadexd, xd,thread,fadeout);//fadeout);
        
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float timemod = iTime * 2.5;
    vec2 mousep = iMouse.xy / iResolution.xy;
    
    float minzoom = 0.02;
    float maxzoom = 1.0;
    float zoom_delta = (sin(timemod * 0.05) + 1.0) / 2.0;
    zoom_delta = pow(zoom_delta, 2.0);
    
    #ifdef MOUSEZOOM
    zoom_delta = sin(mousep.x + (timemod * 0.05));
    #endif
    zoom = mix(minzoom, maxzoom, zoom_delta);
    inv_zoom = 1.0 / zoom;
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 orignal_uv = uv;
    
    float ar = iResolution.x / iResolution.y;
    
    uv.x = (uv.x * ar);
    uv -= 0.5;
    uv *= zoom;
    uv += 0.5;
    uv.x -= 0.5;
    
    vec2 centre  = vec2(0.4, 0.5);
    float centre_radius = 0.2;
    float radius = 1.2;
    
    float r = mousep.y * PI + zoom_delta * 5.0 ;
 
    vec2 ruv = rotate_around(uv, centre, r );
    
    float twist_amount = 6.0;//sin(iTime * 1.0)*5.0;
  
    vec4 galaxy_params = Galaxy(ruv,centre, centre_radius, radius, twist_amount, 0.0, 2.0);
    
   	float galactic_centre = SphereShape(uv, centre, 0.4, 3.0, 1.);
    vec3 col = bluegrad(galaxy_params.x * galaxy_params.w * 0.7);
    
    #ifdef AUDIOPULSE
    float pulse_nebula = 0.4 + 0.0; // texture(iChannel1, vec2(ruv.x * 0.001, 0.3)).b;
    #else
    float pulse_nebula = 0.7;
    #endif
    col += bluegrad(pow(galaxy_params.x, 6.0) * pulse_nebula * clamp(0.8-galaxy_params.w, 0.0, 1.0) * clamp(pow(galaxy_params.w * 2000.0, 2.0), 0.0, 1.0))   ;
    
    float thread = clamp(galaxy_params.z - galactic_centre * 1.0, 0.0, 1.0);
    float ribbon_fadeout = (0.02 + pow(galaxy_params.w * 2.0, 2.0)) * 0.3;
    col += orangegrad(pow(thread,10.0) ) * ribbon_fadeout * 2.0 ;
    col -= bluegrad(pow(thread,60.0)) *  ribbon_fadeout * 3.0;
    col += orangegrad(galactic_centre * 0.80) ;
    
    float cellsize = 30.0;
    vec2 ruv2 = rotate_around(uv,centre, r);
    float starscale = 0.15;
    float starpowcurve = 5.0;
    float seed = 1.0;
    vec3 starcolbase =  vec3(0.5,0.2,0.4) * 2.0;    
    vec3 starcol = starcolbase;
    

    starscale = 20.0;
    #ifdef AUDIOPULSE
    float starbrightness = 0.2 + 0.0; // texture(iChannel1, vec2(ruv.x * 0.001, ruv.y * 0.5)).g * 1.9;// * 15.3 + (galaxy_params.x * 2.0) ;
    #else
    float starbrightness = 0.7 * (1.0 / pow(zoom, 0.4));
    #endif
    for (int i = 0; i < 10; ++i)
    {        
        
        float starsize = 0.4;
        float fadeout = pow(galaxy_params.y, 4.0) * 0.9 *  (galaxy_params.w  * 0.9 + 0.1) + 0.1;
        col += voronoi_stars(ruv * starscale) * fadeout * starbrightness;//star_b * starcol ;
        starbrightness *= 0.9;
        starscale *= 2.0;
      
       
    }
    vec4 sound_col = vec4(0.4); // 0.4 + texture(iChannel1,  orignal_uv);
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}
`;
