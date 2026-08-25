"""Inspect FBX/GLB assets with Blender and emit a deterministic JSON report.

Usage:
  blender --background --python audit_assets.py -- --output report.json file1.glb file2.fbx
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.actions, bpy.data.armatures, bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(datablocks):
            datablocks.remove(item)


def import_asset(path: Path) -> None:
    if path.suffix.lower() in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif path.suffix.lower() == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path), automatic_bone_orientation=False)
    else:
        raise ValueError(f"unsupported asset type: {path.suffix}")


def action_summary(action) -> dict:
    start, end = action.frame_range
    fps = bpy.context.scene.render.fps or 30
    slots = getattr(action, "slots", ())
    return {
        "name": action.name,
        "frameStart": round(float(start), 3),
        "frameEnd": round(float(end), 3),
        "durationSeconds": round(max(float(end - start), 0.0) / fps, 3),
        "slots": len(slots),
    }


def inspect(path: Path) -> dict:
    reset_scene()
    import_asset(path)
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    bones = sorted({bone.name for armature in armatures for bone in armature.data.bones})
    return {
        "path": path.as_posix(),
        "sizeBytes": path.stat().st_size,
        "armatures": [{"name": obj.name, "boneCount": len(obj.data.bones)} for obj in armatures],
        "boneNames": bones,
        "meshCount": len(meshes),
        "vertexCount": sum(len(obj.data.vertices) for obj in meshes),
        "materialCount": len(bpy.data.materials),
        "imageCount": len(bpy.data.images),
        "actions": sorted((action_summary(action) for action in bpy.data.actions), key=lambda item: item["name"]),
    }


def main() -> None:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("assets", nargs="+")
    options = parser.parse_args(arguments)
    report = {"blenderVersion": bpy.app.version_string, "assets": [], "errors": []}
    for raw_path in options.assets:
        path = Path(raw_path).resolve()
        try:
            report["assets"].append(inspect(path))
            print(f"[audit] OK {path}")
        except Exception as error:  # Blender import errors must not hide other assets.
            report["errors"].append({"path": path.as_posix(), "error": str(error)})
            print(f"[audit] ERROR {path}: {error}")
    output = Path(options.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if report["errors"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
