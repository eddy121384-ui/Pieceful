// Original dry-brush rule, applied only to non-interactive HUD decoration.
shader_type canvas_item;

void fragment() {
	float fleck = fract(sin(dot(floor(FRAGCOORD.xy), vec2(43.71, 91.13))) * 47453.545);
	float taper = smoothstep(0.0, 0.12, UV.x) * smoothstep(0.0, 0.12, 1.0 - UV.x);
	float edge = 1.0 - abs(UV.y * 2.0 - 1.0);
	COLOR = vec4(vec3(0.34, 0.43, 0.40), taper * edge * (0.12 + fleck * 0.16));
}
