# Rotation UX Decision

Status: **Accepted for V0-02**

## Decision

Piece rotation is **not part of V0**.

The V0 runtime keeps every puzzle piece in the artwork's canonical orientation. There is no rotate button, free-angle rotation, twist gesture, or implicit two-finger rotation gesture.

Rotation may be introduced later as an **optional challenge setting**, but it should default **Off** so the current low-friction workspace remains the normal experience.

## Why V0 stays rotation-free

The current runtime deliberately treats a piece's canonical orientation as an invariant across:

- neighbor-relative snap,
- persistent off-board clusters,
- cluster-to-board anchoring,
- solved-state positioning,
- Portrait / Landscape live reflow,
- Hint target semantics,
- Board Preview / Board Lines,
- future Save / Resume state.

Adding rotation now would therefore not be an isolated input feature. It would expand the state model and require coordinated changes to snap, cluster transforms, persistence, touch ownership, reflow, and regression testing.

V0-02 is specifically the basic puzzle workspace. Keeping rotation out prevents the final device smoke from becoming a second interaction-system project.

## Future rotation contract

If rotation is introduced in a later milestone, the first supported version should follow these constraints:

1. **Optional and default Off.** Existing no-rotation play remains the default.
2. **Discrete 90-degree steps only.** Do not start with arbitrary-angle rotation.
3. **Explicit control, not a pinch/twist gesture.** Touch pinch is reserved for camera zoom/pan so piece manipulation and navigation do not compete for the same gesture.
4. **Rotation is real puzzle state.** It must persist through Save / Resume and survive Portrait / Landscape reflow.
5. **Clusters behave as rigid assemblies.** A connected cluster, if rotatable at all, rotates as one rigid object; member-relative transforms may not drift.
6. **Board anchoring requires canonical orientation.** A piece or cluster cannot solve while rotated away from the artwork's correct orientation.
7. **Hint / Preview must not silently correct rotation.** Assistance may indicate orientation, but must not auto-rotate or solve the piece.
8. **No CutPattern mutation.** Approved die geometry stays canonical; runtime rotation is a transform applied to piece / cluster state.

## Product implication

The no-rotation V0 still supports a full challenge spectrum through piece count and the independent assistance controls:

- Preview Off / Float / Board,
- Hint On / Off,
- Board Lines On / Off.

A future Rotation On mode can be added as another challenge dimension without changing the normal Pieceful experience.

## V0-02 close-gate result

Rotation UX is no longer an open scope question for V0-02:

- **V0:** no rotation.
- **Later:** optional, default Off, 90-degree step design subject to its own implementation issue and device validation.
