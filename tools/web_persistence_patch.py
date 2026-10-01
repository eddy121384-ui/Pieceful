"""Keep Godot 4.7.2 IDBFS reconciliation consistent with live save retirement.

The shipped Emscripten helper enumerates local filenames, awaits IndexedDB,
then reads those filenames. Completing/deleting a game during that await
removes a file from the earlier list and aborts syncing with ENOENT.
Enumerate IndexedDB first; local enumeration and reading then run in the same
JavaScript turn. No buffers are copied, save schemas changed, or errors hidden.
"""
from pathlib import Path

LOCAL_FIRST = (
    "syncfs:(mount,populate,callback)=>{"
    "IDBFS.getLocalSet(mount,(err,local)=>{if(err)return callback(err);"
    "IDBFS.getRemoteSet(mount,(err,remote)=>{if(err)return callback(err);"
)
REMOTE_FIRST = (
    "syncfs:(mount,populate,callback)=>{"
    "/* Pieceful IDBFS: read the live local view after the asynchronous remote view. */"
    "IDBFS.getRemoteSet(mount,(err,remote)=>{if(err)return callback(err);"
    "IDBFS.getLocalSet(mount,(err,local)=>{if(err)return callback(err);"
)


def patch_web_persistence(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    if REMOTE_FIRST in source:
        return
    if source.count(LOCAL_FIRST) != 1:
        raise SystemExit("Unsupported Godot Web IDBFS helper: review the persistence patch before publishing")
    path.write_text(source.replace(LOCAL_FIRST, REMOTE_FIRST, 1), encoding="utf-8")
    print(f"Patched Web persistence reconciliation in {path}")
