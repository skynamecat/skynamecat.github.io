import bpy
from math import radians
from mathutils import Quaternion, Vector

source = r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\tmp\fbx-convert\pangbobo-blender-actions.glb"
output_dir = r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\tmp\fbx-convert"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)
armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
armature.animation_data.action = None

corners = []
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
minimum = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
maximum = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
center = (minimum + maximum) * 0.5

camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.scene.collection.objects.link(camera)
camera.location = center + Vector((0, -8, 0))
camera.rotation_euler = ((center - camera.location).to_track_quat("-Z", "Y")).to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(maximum.x - minimum.x, maximum.z - minimum.z) * 1.12
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
scene.render.resolution_x = 320
scene.render.resolution_y = 320
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"

variants = [
    ("y1", 0, 20, 70, 0, 0),
    ("y2", 0, 20, 105, 0, 0),
    ("y3", 0, 30, 85, 0, 0),
    ("y4", 0, 30, 120, 0, 0),
    ("y5", 0, 40, 100, 0, 0),
    ("y6", 0, 45, 130, 0, 0),
]

def rotate(name, turns):
    bone = armature.pose.bones[name]
    rest_rotation = bone.bone.matrix_local.to_3x3()
    rotation = Quaternion()
    for axis, degrees in turns:
        local_axis = (rest_rotation.inverted() @ Vector(axis)).normalized()
        rotation = rotation @ Quaternion(local_axis, radians(degrees))
    bone.rotation_mode = "QUATERNION"
    bone.rotation_quaternion = rotation

for label, shoulder_y, arm_y, forearm_y, arm_z, forearm_z in variants:
    for bone in armature.pose.bones:
        bone.matrix_basis.identity()
        bone.rotation_mode = "QUATERNION"
    rotate("RightShoulder", [((0, 1, 0), shoulder_y)])
    rotate("RightArm", [((0, 1, 0), arm_y), ((0, 0, 1), arm_z)])
    rotate("RightForeArm", [((0, 1, 0), forearm_y), ((0, 0, 1), forearm_z)])
    rotate("RightHand", [((0, 1, 0), -12)])
    bpy.context.view_layer.update()
    scene.render.filepath = output_dir + "\\wave-variant-" + label + ".png"
    bpy.ops.render.render(write_still=True)
