import bpy
import json

source = r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\tmp\fbx-convert\pangbobo-animated.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)

armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
actions = []
for action in bpy.data.actions:
    actions.append({
        "name": action.name,
        "frame_range": list(action.frame_range),
        "slots": len(action.slots),
        "fcurves": len(list(action.fcurves)) if hasattr(action, "fcurves") else None,
    })

result = {
    "objects": [{"name": obj.name, "type": obj.type} for obj in bpy.context.scene.objects],
    "armatures": [
        {
            "name": armature.name,
            "bones": [bone.name for bone in armature.data.bones],
            "active_action": armature.animation_data.action.name
            if armature.animation_data and armature.animation_data.action
            else None,
        }
        for armature in armatures
    ],
    "actions": actions,
    "scene_frames": [bpy.context.scene.frame_start, bpy.context.scene.frame_end],
    "fps": bpy.context.scene.render.fps,
}

if armatures:
    armature = armatures[0]
    samples = {}
    for frame in (0, 12, 25, 37, 50):
        bpy.context.scene.frame_set(frame)
        samples[str(frame)] = {
            name: {
                "location": [round(value, 5) for value in armature.pose.bones[name].location],
                "quaternion": [round(value, 5) for value in armature.pose.bones[name].rotation_quaternion],
            }
            for name in ("Hips", "LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg", "LeftFoot", "RightFoot")
        }
    result["samples"] = samples

print("PANGBOBO_INSPECT=" + json.dumps(result, ensure_ascii=False))
