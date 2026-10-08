"""Rank actual PCK payloads; keep calculated gzip separate from measured transfer."""
import argparse
import gzip
import json
from pathlib import Path
import re
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'release'))
from inspect_pack import read_directory


def inventory(pack, stage):
    imports = {}
    for path in (stage / 'assets').rglob('*.import'):
        text = path.read_text()
        source = re.search(r'^source_file="res://([^"]+)"', text, re.M)
        for dest in re.findall(r'"res://(\.godot/imported/[^"]+)"', text):
            if source:
                imports[dest] = source[1]
    groups = {}
    ranked = []
    with pack.open('rb') as stream:
        for entry in read_directory(pack):
            name = entry['path']
            source = imports.get(name, name)
            if '/puzzles/' in source: category = 'full artwork (35 imported resources)'
            elif '/thumbs/' in source: category = 'thumbnails (35 imported resources)'
            elif source.endswith(('.otf', '.ttf')): category = 'fonts'
            elif source.startswith('cut_patterns/'): category = 'cut patterns'
            elif source.endswith(('.gdshader', '.gdshaderinc')): category = 'shaders'
            elif source.endswith(('.gd', '.gdc', '.remap', '.tscn', '.scn')): category = 'scripts / scenes / remaps'
            elif source.startswith(('assets/',)): category = 'UI / plain-paper fallback'
            elif source.endswith(('.json', '.txt')): category = 'metadata / notices'
            elif source.startswith('.godot/'): category = 'Godot generated metadata'
            else: category = 'other / project binary'
            stream.seek(entry['offset']);data = stream.read(entry['bytes'])
            size = len(gzip.compress(data, mtime=0))
            row = {**entry, 'source': source, 'category': category, 'calculated_gzip_bytes': size}
            ranked.append(row)
            group = groups.setdefault(category, {'resources': 0, 'raw_payload_bytes': 0, 'calculated_individual_gzip_bytes': 0})
            group['resources'] += 1;group['raw_payload_bytes'] += entry['bytes'];group['calculated_individual_gzip_bytes'] += size
    return {'pack_bytes': pack.stat().st_size, 'groups': groups,
            'ranked': sorted(ranked, key=lambda r:r['bytes'], reverse=True),
            'note': 'Payload sums exclude PCK directory/alignment. Individually gzipped payloads do not sum to whole-PCK gzip. No CDN transfer claim.'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', type=Path, required=True)
    parser.add_argument('--stage', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory(args.pack, args.stage), indent=2)+'\n')
