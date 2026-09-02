# Pieceful Jigsaw Geometry Terminology

Status: canonical project vocabulary for code, UI, JSON metadata, architecture notes, and engineering discussion.

This document is a Pieceful convention. Jigsaw manufacturers, players, and puzzle software do not use one globally standardized vocabulary. External sources may use synonyms such as knob, peg, outie, innie, socket, or hole. Inside Pieceful, use the terms below consistently.

## Canonical edge terms

| 中文 | Canonical English | Definition | Common external synonyms |
|---|---|---|---|
| 凸榫 | **Tab** | The outward-projecting feature of an internal puzzle edge. The same shared cut appears as a Blank on the neighboring piece. | knob, peg, outie |
| 凹槽 | **Blank** | The inward-recessed feature that receives the neighboring piece's Tab. | socket, hole, innie |
| 平邊 | **Flat Edge** | An outer-frame edge with no Tab or Blank. | straight edge, border edge |
| 刀線 | **Cut Line** | The geometric boundary produced by the virtual die. | cut, edge profile |
| 凸凹方向 | **Polarity** | The orientation of one shared internal edge: which adjacent piece sees a Tab and which sees a Blank. | — |

## Canonical Tab / Blank geometry

A Tab is described as a feature attached to the normal edge/ribbon. The neighboring Blank is not a separately authored shape: it is the complementary view of the exact same shared cut.

### Crown / Head

**Crown** is the Pieceful canonical term for the rounded outer head of a Tab. `Head` may be used descriptively, but code and parameter names should prefer `crown` when possible.

Relevant measurements:

- **Crown Width**: lateral width of the rounded head itself.
- **Crown Height**: local vertical/radial height of the crown region.
- **Crown Asymmetry**: left/right imbalance of the crown geometry.
- **Crown Roundness**: how full or rounded the crown reads visually.

### Neck

The **Neck** is the narrow region connecting the Crown to the wider Shoulder / body transition.

Relevant measurement:

- **Neck Width**: width of the narrowest meaningful portion of the neck.

### Shoulder

The **Shoulder** is the region where the Tab expands away from the Neck and transitions back toward the ordinary cut line.

Relevant measurements:

- **Shoulder Width / Reach**: lateral extent of the shoulder transition.
- **Shoulder Blend**: softness / length of the transition from Shoulder through Root back into the Ribbon.

### Root / Transition

The **Root** is the local transition region where the Tab feature fully returns to the ordinary shared cut line / Ribbon. `Transition` is acceptable descriptive language; use `root` for geometry naming when a single noun is required.

### Tab Depth

**Tab Depth** is the perpendicular distance from the local baseline / ribbon region to the outermost Tab extent. This is the formal term for the parameter previously called “mushroom height” in casual discussion.

### Tab Width

**Tab Width** describes the overall lateral span of the Tab feature. Do not use it interchangeably with Crown Width or Neck Width.

## Whole-piece terms

### Piece Body

The **Piece Body** is the main central area of a puzzle piece apart from its Tabs / Blanks.

### Edge

Each piece has four logical edge positions:

- Top Edge
- Right Edge
- Bottom Edge
- Left Edge

Each edge is one of:

- `Tab`
- `Blank`
- `Flat`

Internal pieces have no Flat Edges. Border pieces have one or more Flat Edges.

### Edge Topology

**Edge Topology** describes the structural combination of Tab / Blank / Flat states around one piece, independent of fine geometry.

For true four-sided interior pieces, Pieceful may use compact topology notation:

- `0T4B`
- `1T3B`
- `2T2B`
- `3T1B`
- `4T0B`

`T` = Tab, `B` = Blank.

These are topology classes, not quality rankings. Extreme `0T4B` and `4T0B` silhouettes are allowed; they may be weighted differently by authoring heuristics but are not structurally invalid.

## Whole-die terms

### Virtual Die

The **Virtual Die** is the complete reusable cut-pattern definition for one puzzle layout. It is the source of truth from which individual piece polygons are derived.

Pieceful does not independently generate neighboring pieces. Shared boundaries are authored once as shared cut geometry.

### Grid / Layout

The **Grid** or **Layout** describes the board-level arrangement:

- Rows
- Columns
- Frame Aspect Ratio
- Resolved Piece Count

The `PuzzleLayoutResolver` may resolve an approximate player difficulty target to a nearby rows × columns layout in order to preserve reasonable individual piece proportions.

### Junction

A **Junction** is the intersection where horizontal and vertical shared cut structures meet. In the ordinary interior grid it is the four-piece meeting point.

### Ribbon

A **Ribbon** is a complete shared cut line flowing across multiple cells in one horizontal or vertical direction. Ribbon is a board-level geometric structure, not a synonym for a single Tab.

Pieceful's current geometry model constructs whole horizontal / vertical ribbons as continuous global curves and divides them per cell only for storage / runtime use.

Relevant measurement:

- **Ribbon Curvature**: large-scale deviation / flow of the shared cut line independent of the local Tab Crown / Neck / Shoulder geometry.

## Current Die Lab parameter names

The five existing shape controls should be understood using the following formal terminology:

1. **Tab Depth** — formerly “mushroom height”.
2. **Crown Width / Roundness** — formerly “mushroom width / roundness”.
3. **Tab Asymmetry** — formerly “mushroom left/right asymmetry”.
4. **Shoulder Blend** — formerly “mushroom shoulder smoothness”.
5. **Ribbon Curvature** — already canonical.

Future UI/code cleanup should prefer these formal names. Existing implementation variable names may be migrated separately rather than renamed opportunistically in unrelated changes.

## Geometry hierarchy

```text
Virtual Die
├── Grid / Layout
│   ├── Rows
│   ├── Columns
│   └── Frame Aspect Ratio
├── Junctions
├── Ribbons
│   ├── Horizontal Ribbons
│   └── Vertical Ribbons
├── Edge Topology
│   ├── Tab
│   ├── Blank
│   └── Flat Edge
└── Piece Geometry
    ├── Piece Body
    └── Edge Feature
        ├── Crown
        ├── Neck
        ├── Shoulder
        ├── Root
        └── Tab Depth / Width
```

## Communication rule

Casual discussion may still use visual nicknames such as “蘑菇” when convenient. Formal code, UI labels, JSON metadata, validation messages, PR descriptions, and documentation should use the canonical vocabulary in this document.

Preferred engineering phrasing example:

> Increase Crown Width slightly, keep Neck Width unchanged, and raise Shoulder Blend while leaving Ribbon Curvature fixed.

This is intentionally more precise than saying “make the mushroom fatter and smoother”.
