import sys
from pathlib import Path

import bpy
from mathutils import Vector


model_path = Path(sys.argv[-2])
preview_path = Path(sys.argv[-1])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(model_path))

armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
animation_names = sorted(action.name for action in bpy.data.actions)
print("ANIMATIONS=" + ",".join(animation_names))
armature.animation_data_create()
armature.animation_data.action = bpy.data.actions.get("Walk")
bpy.context.scene.frame_set(7)

corners = []
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
minimum = Vector(tuple(min(point[index] for point in corners) for index in range(3)))
maximum = Vector(tuple(max(point[index] for point in corners) for index in range(3)))
center = (minimum + maximum) * 0.5

camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.scene.collection.objects.link(camera)
camera.location = center + Vector((0, -8, 0))
camera.rotation_euler = ((center - camera.location).to_track_quat("-Z", "Y")).to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(maximum.x - minimum.x, maximum.z - minimum.z) * 1.18
bpy.context.scene.camera = camera

light_data = bpy.data.lights.new(type="AREA", name="PreviewLight")
light_data.energy = 1100
light_data.size = 5
light = bpy.data.objects.new("PreviewLight", light_data)
light.location = (-4, -5, 7)
bpy.context.scene.collection.objects.link(light)
light.rotation_euler = ((center - light.location).to_track_quat("-Z", "Y")).to_euler()

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 384
scene.render.resolution_y = 384
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(preview_path)
bpy.ops.render.render(write_still=True)
