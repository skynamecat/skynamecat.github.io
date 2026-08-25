"""Build one skeleton-v1 GLB containing every Pangbobo action."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
import bpy


def args():
    values = sys.argv[sys.argv.index("--") + 1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--daily", required=True)
    parser.add_argument("--hiphop", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(values)


def import_glb_actions(path: Path, prefix: str) -> list:
    before_objects = {obj.as_pointer() for obj in bpy.data.objects}
    before_actions = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=str(path))
    actions = list(set(bpy.data.actions) - before_actions)
    for action in actions:
        # glTF import may suffix names when both files contain similar clips.
        action.name = action.name.split(".")[0]
        action.use_fake_user = True
    imported_objects = [obj for obj in bpy.data.objects if obj.as_pointer() not in before_objects]
    for obj in imported_objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    print(f"[{prefix}] {len(actions)} actions: {', '.join(sorted(a.name for a in actions))}")
    return actions


def main():
    options = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(Path(options.model).resolve()), use_anim=False)
    source_objects = list(bpy.context.scene.objects)
    armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    armature.animation_data_create()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)

    daily = import_glb_actions(Path(options.daily).resolve(), "daily")
    hiphop = import_glb_actions(Path(options.hiphop).resolve(), "hiphop")
    expected = {"Idle", "Walk", "Rest", "Stretch", "Look", "Wave", "Phone", "Laptop", "Happy", "Music", "Drink", "EatCake",
                "Bounce", "BodyWave", "Slide", "ArmWave", "Lock", "Pop", "Groove", "Robot", "KickStep", "Spin", "Freeze", "FunkBlast"}
    actual = {action.name for action in daily + hiphop}
    missing = sorted(expected - actual)
    if missing:
        raise RuntimeError(f"missing actions: {', '.join(missing)}")

    scene = bpy.context.scene
    scene.render.fps = 30
    armature.animation_data.action = None
    for image in bpy.data.images:
        if image.size[0] > 1024 or image.size[1] > 1024:
            image.scale(1024, 1024)

    output = Path(options.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in source_objects:
        if obj.name in bpy.context.scene.objects:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(output), export_format="GLB", export_animations=True,
        export_animation_mode="ACTIONS", export_extra_animations=True,
        export_force_sampling=True, export_optimize_animation_size=True,
        export_skins=True, export_image_format="AUTO", use_selection=True,
    )
    print(f"[pack] {output} ({output.stat().st_size / 1024 / 1024:.2f} MB), {len(actual)} actions")


if __name__ == "__main__":
    main()
