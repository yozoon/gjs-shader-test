uniform sampler2D texture;

uniform float offsetx;
uniform float offsety;
uniform float halfpixelx;
uniform float halfpixely;

vec2 offset = vec2(offsetx, offsety);
vec2 halfpixel = vec2(halfpixelx, halfpixely);

void main()
{
    vec2 uv = cogl_tex_coord_in[0].xy;
    vec4 sum = texture2D(texture, uv) * 4.0;
    sum += texture2D(texture, uv - halfpixel.xy * offset);
    sum += texture2D(texture, uv + halfpixel.xy * offset);
    sum += texture2D(texture, uv + vec2(halfpixel.x, -halfpixel.y) * offset);
    sum += texture2D(texture, uv - vec2(halfpixel.x, -halfpixel.y) * offset);

    cogl_color_out = sum / 8.0;
}
