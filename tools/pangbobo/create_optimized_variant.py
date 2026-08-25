import sys
from pathlib import Path

import bpy


SOURCE = Path(r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\public\pangbobo\pangbobo-actions.glb")


def resize_textures(max_size: int) -> None:
    for image in bpy.data.images:
        width, height = image.size
        largest = max(width, height)
        if largest <= max_size:
            continue
        scale = max_size / largest
        image.scale(max(1, round(width * scale)), max(1, round(height * scale)))


def decimate_meshes(ratio: float) -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new(name="WebDecimate", type="DECIMATE")
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: blender ... -- <balanced|lite> <output.glb>")

    variant = sys.argv[-2]
    output = Path(sys.argv[-1])
    settings = {
        "balanced": {"ratio": 0.58, "texture": 512},
        "lite": {"ratio": 0.28, "texture": 256},
    }
    if variant not in settings:
        raise SystemExit(f"unknown variant: {variant}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE), import_pack_images=False)
    resize_textures(settings[variant]["texture"])
    decimate_meshes(settings[variant]["ratio"])

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_extra_animations=True,
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_skins=True,
        export_morph=False,
        export_materials="EXPORT",
    )


main()
