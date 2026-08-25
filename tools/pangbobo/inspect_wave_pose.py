import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\tmp\fbx-convert\pangbobo-blender-actions.glb")

armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
armature.animation_data_create()
armature.animation_data.action = bpy.data.actions.get("Wave")
bpy.context.scene.frame_set(10)
bpy.context.view_layer.update()

for name in ("RightShoulder", "RightArm", "RightForeArm", "RightHand"):
    bone = armature.pose.bones[name]
    head = armature.matrix_world @ bone.head
    tail = armature.matrix_world @ bone.tail
    print(name, "head", tuple(round(value, 4) for value in head), "tail", tuple(round(value, 4) for value in tail))
