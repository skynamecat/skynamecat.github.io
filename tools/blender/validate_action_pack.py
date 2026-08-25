"""Validate Pangbobo action names, skeleton and loop continuity."""
from __future__ import annotations
import argparse, json, math, sys
from pathlib import Path
import bpy

EXPECTED = {"Idle", "Walk", "Rest", "Stretch", "Look", "Wave", "Phone", "Laptop", "Happy", "Music", "Drink", "EatCake",
            "Bounce", "BodyWave", "Slide", "ArmWave", "Lock", "Pop", "Groove", "Robot", "KickStep", "Spin", "Freeze", "FunkBlast"}
LOOPS = {"Idle", "Walk", "Rest", "Look", "Phone", "Laptop", "Music", "Drink",
         "Bounce", "BodyWave", "Slide", "Groove"}


def parse_args():
    values = sys.argv[sys.argv.index("--") + 1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(values)


def pose_snapshot(armature, frame):
    bpy.context.scene.frame_set(round(frame))
    bpy.context.view_layer.update()
    return {bone.name: bone.matrix_basis.copy() for bone in armature.pose.bones}


def compare(first, last):
    max_location = 0.0
    max_angle = 0.0
    for name, first_matrix in first.items():
        first_loc, first_rot, _ = first_matrix.decompose()
        last_loc, last_rot, _ = last[name].decompose()
        max_location = max(max_location, (first_loc - last_loc).length)
        max_angle = max(max_angle, math.degrees(first_rot.rotation_difference(last_rot).angle))
    return round(max_location, 6), round(max_angle, 3)


def main():
    options = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(Path(options.input).resolve()))
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"expected one armature, found {len(armatures)}")
    armature = armatures[0]
    armature.animation_data_create()
    results = []
    for action in sorted(bpy.data.actions, key=lambda item: item.name):
        armature.animation_data.action = action
        start, end = action.frame_range
        location_error, angle_error = compare(pose_snapshot(armature, start), pose_snapshot(armature, end))
        results.append({"name": action.name, "frames": [round(start, 2), round(end, 2)],
                        "loopRequired": action.name in LOOPS, "loopLocationError": location_error,
                        "loopAngleErrorDegrees": angle_error,
                        "loopPass": action.name not in LOOPS or (location_error < 0.001 and angle_error < 3.0)})
    actual = {item["name"] for item in results}
    report = {"input": Path(options.input).resolve().as_posix(), "skeletonVersion": "skeleton-v1",
              "boneCount": len(armature.data.bones), "missingActions": sorted(EXPECTED - actual),
              "unexpectedActions": sorted(actual - EXPECTED), "actions": results}
    output = Path(options.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if report["boneCount"] != 28 or report["missingActions"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
