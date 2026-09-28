shader_type canvas_item;
// #55 paper relief: the rounded die-cut edge of a printed cardboard tile.
//
// Drawn on a Line2D band centred on the cut contour. Line2D already provides
// the across-band coordinate for free (UV.y: 0 = outer band edge, 0.5 = cut,
// 1 = inner band edge), so the CPU never walks the 1k-point contour.
//
// The band never paints a colour of its own. Premultiplied blending turns the
// output into   dst * (1 - a) + rgb:
//   a   = multiplicative shade (rim rolling away from the light),
//   rgb = additive sheen (rim rolling toward the light).
// The printed artwork therefore stays visible through the whole bevel, and the
// band fades to zero at both of its ends, so it never has a drawable edge.
render_mode blend_premul_alpha, unshaded;

// Key light in piece-local space (y down): upper-left, like the benchmark.
uniform vec2 light_dir = vec2(-0.56, -0.83);
// Fraction of the inner half that is rolled edge; the rest is flat face.
uniform float roll_extent : hint_range(0.05, 1.0) = 1.0;
uniform float sheen_strength : hint_range(0.0, 1.0) = 0.30;
uniform float gloss_strength : hint_range(0.0, 1.0) = 0.16;
uniform float shade_strength : hint_range(0.0, 1.0) = 0.42;
uniform vec3 sheen_tint : source_color = vec3(1.0, 0.985, 0.95);
// Lower-right crease where the face turns into the cardboard side wall.
// Only loose pieces use it: on joined/solved boards it would fall on a
// neighbour face and depend on sibling draw order.
uniform float crease_strength : hint_range(0.0, 1.0) = 0.0;

varying vec2 local_pos;

void vertex() {
	local_pos = VERTEX;
}

void fragment() {
	float band = UV.y;
	// Outward normal of the cut in local space. Solving d(band)/d(local)
	// through both screen derivatives keeps it independent of any viewport
	// y-flip, camera zoom or Rail holder scale.
	vec2 dpx = dFdx(local_pos);
	vec2 dpy = dFdy(local_pos);
	float dbx = dFdx(band);
	float dby = dFdy(band);
	float det = dpx.x * dpy.y - dpx.y * dpy.x;
	vec2 inward = vec2(dpy.y * dbx - dpx.y * dby, dpx.x * dby - dpy.x * dbx) * sign(det);
	float inward_len = length(inward);
	vec2 normal = inward_len > 1e-8 ? -inward / inward_len : vec2(0.0);
	float facing = dot(normal, normalize(light_dir));
	float lit = max(facing, 0.0);
	float away = max(-facing, 0.0);

	// s < 0 outside the cut, s > 0 on the face. One-pixel coverage ramp keeps
	// the rolled edge from stair-stepping against the table.
	float s = band * 2.0 - 1.0;
	float px = max(fwidth(s), 1e-4);
	float on_face = clamp(s / px + 0.5, 0.0, 1.0);

	// Rounded roll: steepest at the cut, easing to a flat face (zero slope)
	// so the bevel has no inner edge that could read as a keyline.
	float t = clamp(s / roll_extent, 0.0, 1.0);
	float roll = pow(1.0 - t, 1.5);
	// Soft specular line sits slightly inside the rim, where the rolled
	// normal faces the half-vector between light and viewer.
	float gloss = exp(-pow((t - 0.26) / 0.28, 2.0)) * lit * lit;

	vec3 add = sheen_tint * (sheen_strength * lit * roll + gloss_strength * gloss) * on_face;
	float shade = shade_strength * pow(away, 0.8) * roll * on_face;

	// Across the cut, the rim keeps rolling down into the side wall.
	float u = clamp(-s, 0.0, 1.0);
	float crease = crease_strength * away * (1.0 - u) * (1.0 - u) * (1.0 - on_face);

	float a = clamp(shade + crease, 0.0, 1.0);
	// Respect CanvasItem modulate / fades the same way the Face does.
	COLOR = vec4(add, a) * COLOR.a;
}
