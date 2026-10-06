# Pieceful Catalog Ink fallback

`catalog-ink-fallback.tres` embeds 3,308 bytes of TrueType font data in a native
Godot FontFile resource. It provides the existing catalog character `箏` (U+7B8F)
which otherwise renders as a missing-glyph box in the Web game. Latin text keeps
the existing fonts. This is a catalog fallback, not a full Japanese text font.

Source: [Google Fonts Noto Sans JP](https://github.com/google/fonts/tree/main/ofl/notosansjp),
`NotoSansJP[wght].ttf`. Download SHA-256:
`c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`.

Derived with fontTools 4.66.1: instantiate weight 400, subset to existing catalog
CJK characters, rename the primary family to Pieceful Catalog Ink Regular, then
serialize bytes as FontFile data. No original font outlines were redrawn.

Copyright 2014–2021 Adobe. Commercial embedding and redistribution are allowed
under SIL Open Font License 1.1. The complete unmodified license is included in
`CATALOG-INK-FONT-LICENSE.txt`. The derivative uses no Reserved Font Name “Source”.

The heart and camera appended to `watercolor-gameplay-icons.svg` are original
Pieceful drawings, using the same 2.4-unit round-capped ink strokes as its first
24 marks. No icon, texture or raster image was imported for this follow-up.
