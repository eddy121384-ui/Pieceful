// Original procedural UI artwork. Static, one fullscreen draw, no image assets.
shader_type canvas_item;

float grain_hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float pigment(vec2 p, vec2 center, vec2 scale) {
	vec2 q = (p - center) / scale;
	float edge = sin(q.x * 7.0 + q.y * 4.0) * 0.06
		+ sin(q.y * 11.0 - q.x * 3.0) * 0.035;
	return exp(-dot(q, q) * (1.8 + edge));
}

void fragment() {
	float fine = grain_hash(floor(FRAGCOORD.xy));
	float fiber = grain_hash(floor(FRAGCOORD.xy / vec2(1.0, 5.0)));
	float grain = (fine - 0.5) * 0.008 + (fiber - 0.5) * 0.003;
	vec3 paper = vec3(0.980, 0.979, 0.961) + grain;
	// A little pigment at the page edges; the puzzle's central field stays clear.
	float sage = pigment(UV, vec2(-0.10, 0.11), vec2(0.45, 0.22));
	float blue = pigment(UV, vec2(1.12, 0.79), vec2(0.48, 0.25));
	float rose = pigment(UV, vec2(0.91, -0.12), vec2(0.36, 0.29));
	paper -= sage * vec3(0.070, 0.042, 0.052);
	paper -= blue * vec3(0.057, 0.038, 0.020);
	paper -= rose * vec3(0.005, 0.028, 0.021);
	COLOR = vec4(paper, 1.0);
}
