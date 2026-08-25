import bpy
from math import radians
from mathutils import Quaternion, Vector

source = r"C:\Users\skynamecat\Documents\ChatGPT\庞菠菠.fbx"
output = r"C:\Users\skynamecat\Documents\ChatGPT\skynamecat.github.io\tmp\fbx-convert\pangbobo-blender-actions.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=source, use_anim=False)

armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
armature.animation_data_create()
for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)

pose_bones = armature.pose.bones


def reset_pose():
    for bone in pose_bones:
        bone.matrix_basis.identity()
        bone.rotation_mode = "QUATERNION"


def armature_axis_in_bone_space(bone_name, axis):
    rest_rotation = pose_bones[bone_name].bone.matrix_local.to_3x3()
    return (rest_rotation.inverted() @ Vector(axis)).normalized()


def apply_rotations(rotations):
    for bone_name, turns in rotations.items():
        rotation = Quaternion()
        for axis, degrees in turns:
            rotation = rotation @ Quaternion(
                armature_axis_in_bone_space(bone_name, axis),
                radians(degrees),
            )
        pose_bones[bone_name].rotation_quaternion = rotation


def make_action(name, driven_bones, keyframes):
    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    armature.animation_data.action = action
    for frame, rotations in keyframes:
        reset_pose()
        apply_rotations(rotations)
        for bone_name in driven_bones:
            pose_bones[bone_name].keyframe_insert(
                data_path="rotation_quaternion",
                frame=frame,
                group=bone_name,
            )
    # Smooth the hand-authored poses before glTF sampling. Quaternion curves
    # otherwise keep noticeably robotic straight-line timing between keys.
    if hasattr(action, "fcurves"):
        fcurves = action.fcurves
    else:
        fcurves = []
        for layer in action.layers:
            for strip in layer.strips:
                for slot in action.slots:
                    channelbag = strip.channelbag(slot)
                    if channelbag:
                        fcurves.extend(channelbag.fcurves)
    for fcurve in fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"
            point.handle_left_type = "AUTO_CLAMPED"
            point.handle_right_type = "AUTO_CLAMPED"
    return action


make_action(
    "Idle",
    ("Spine2", "Neck", "Head"),
    [
        (1, {"Spine2": [((1, 0, 0), -1.2)], "Head": [((1, 0, 0), 0.8)]}),
        (30, {"Spine2": [((1, 0, 0), 1.5)], "Head": [((1, 0, 0), -0.8)]}),
        (60, {"Spine2": [((1, 0, 0), -1.2)], "Head": [((1, 0, 0), 0.8)]}),
    ],
)

make_action(
    "Walk",
    (
        "Hips", "Spine1", "LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg",
        "LeftLeg", "RightLeg", "LeftFoot", "RightFoot",
    ),
    [
        (1, {
            "Hips": [((0, 1, 0), -1.5)], "Spine1": [((0, 1, 0), 1.2)],
            "LeftUpLeg": [((1, 0, 0), 20)], "RightUpLeg": [((1, 0, 0), -18)],
            "LeftLeg": [((1, 0, 0), -6)], "RightLeg": [((1, 0, 0), -22)],
            "LeftFoot": [((1, 0, 0), -6)], "RightFoot": [((1, 0, 0), 10)],
            "LeftArm": [((0, 0, 1), -14)], "RightArm": [((0, 0, 1), 14)],
        }),
        (7, {
            "LeftUpLeg": [((1, 0, 0), 4)], "RightUpLeg": [((1, 0, 0), 5)],
            "LeftLeg": [((1, 0, 0), -4)], "RightLeg": [((1, 0, 0), -34)],
            "LeftFoot": [((1, 0, 0), 2)], "RightFoot": [((1, 0, 0), 15)],
            "LeftArm": [((0, 0, 1), -4)], "RightArm": [((0, 0, 1), 4)],
        }),
        (13, {
            "Hips": [((0, 1, 0), 1.5)], "Spine1": [((0, 1, 0), -1.2)],
            "LeftUpLeg": [((1, 0, 0), -18)], "RightUpLeg": [((1, 0, 0), 20)],
            "LeftLeg": [((1, 0, 0), -22)], "RightLeg": [((1, 0, 0), -6)],
            "LeftFoot": [((1, 0, 0), 10)], "RightFoot": [((1, 0, 0), -6)],
            "LeftArm": [((0, 0, 1), 14)], "RightArm": [((0, 0, 1), -14)],
        }),
        (19, {
            "LeftUpLeg": [((1, 0, 0), 5)], "RightUpLeg": [((1, 0, 0), 4)],
            "LeftLeg": [((1, 0, 0), -34)], "RightLeg": [((1, 0, 0), -4)],
            "LeftFoot": [((1, 0, 0), 15)], "RightFoot": [((1, 0, 0), 2)],
            "LeftArm": [((0, 0, 1), 4)], "RightArm": [((0, 0, 1), -4)],
        }),
        (25, {
            "Hips": [((0, 1, 0), -1.5)], "Spine1": [((0, 1, 0), 1.2)],
            "LeftUpLeg": [((1, 0, 0), 20)], "RightUpLeg": [((1, 0, 0), -18)],
            "LeftLeg": [((1, 0, 0), -6)], "RightLeg": [((1, 0, 0), -22)],
            "LeftFoot": [((1, 0, 0), -6)], "RightFoot": [((1, 0, 0), 10)],
            "LeftArm": [((0, 0, 1), -14)], "RightArm": [((0, 0, 1), 14)],
        }),
    ],
)

make_action(
    "Phone",
    (
        "Spine2", "Neck", "Head", "RightShoulder", "RightArm",
        "RightForeArm", "RightHand", "LeftArm", "LeftForeArm",
    ),
    [
        (1, {
            "Spine2": [((1, 0, 0), 3)], "Neck": [((1, 0, 0), 5)],
            "Head": [((1, 0, 0), 8), ((0, 0, 1), -3)],
            "RightShoulder": [((0, 0, 1), 4)],
            "RightArm": [((0, 1, 0), -18), ((0, 0, 1), 16)],
            "RightForeArm": [((0, 1, 0), -12), ((0, 0, 1), 124)],
            "RightHand": [((0, 1, 0), -8), ((0, 0, 1), 10)],
            "LeftArm": [((0, 1, 0), 12), ((0, 0, 1), 5)],
            "LeftForeArm": [((0, 1, 0), 14)],
        }),
        (36, {
            "Spine2": [((1, 0, 0), 3)], "Neck": [((1, 0, 0), 5)],
            "Head": [((1, 0, 0), 8), ((0, 0, 1), 2)],
            "RightShoulder": [((0, 0, 1), 4)],
            "RightArm": [((0, 1, 0), -18), ((0, 0, 1), 15)],
            "RightForeArm": [((0, 1, 0), -10), ((0, 0, 1), 121)],
            "RightHand": [((0, 1, 0), -8), ((0, 0, 1), 6)],
            "LeftArm": [((0, 1, 0), 12), ((0, 0, 1), 5)],
            "LeftForeArm": [((0, 1, 0), 14)],
        }),
        (72, {
            "Spine2": [((1, 0, 0), 3)], "Neck": [((1, 0, 0), 5)],
            "Head": [((1, 0, 0), 8), ((0, 0, 1), -3)],
            "RightShoulder": [((0, 0, 1), 4)],
            "RightArm": [((0, 1, 0), -18), ((0, 0, 1), 16)],
            "RightForeArm": [((0, 1, 0), -12), ((0, 0, 1), 124)],
            "RightHand": [((0, 1, 0), -10), ((0, 0, 1), 8)],
            "LeftArm": [((0, 1, 0), 12), ((0, 0, 1), 5)],
            "LeftForeArm": [((0, 1, 0), 14)],
        }),
    ],
)

make_action(
    "Drink",
    (
        "Spine2", "Neck", "Head", "RightArm", "RightForeArm", "RightHand",
        "LeftArm", "LeftForeArm",
    ),
    [
        (1, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 2), ((0, 1, 0), -2)],
            "RightArm": [((0, 1, 0), 18)],
            "RightForeArm": [((0, 1, 0), 104)], "RightHand": [((0, 1, 0), -8)],
            "LeftArm": [((0, 1, 0), 5)], "LeftForeArm": [((0, 1, 0), 8)],
        }),
        (24, {
            "Spine2": [((1, 0, 0), 2)], "Neck": [((1, 0, 0), 3)],
            "Head": [((1, 0, 0), 4), ((0, 1, 0), -1)],
            "RightArm": [((0, 1, 0), 20)],
            "RightForeArm": [((0, 1, 0), 108)], "RightHand": [((0, 1, 0), -5)],
            "LeftArm": [((0, 1, 0), 5)], "LeftForeArm": [((0, 1, 0), 8)],
        }),
        (48, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 2), ((0, 1, 0), -2)],
            "RightArm": [((0, 1, 0), 18)],
            "RightForeArm": [((0, 1, 0), 104)], "RightHand": [((0, 1, 0), -8)],
            "LeftArm": [((0, 1, 0), 5)], "LeftForeArm": [((0, 1, 0), 8)],
        }),
    ],
)

make_action(
    "EatCake",
    (
        "Spine2", "Neck", "Head", "LeftShoulder", "RightShoulder",
        "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand",
    ),
    [
        (1, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 2), ((0, 1, 0), 2)],
            "LeftShoulder": [((0, 0, 1), -1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -24)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -10)],
            "LeftHand": [((1, 0, 0), -3)],
            "RightArm": [((0, 1, 0), 18)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -10)],
        }),
        (18, {
            "Spine2": [((1, 0, 0), 2)], "Neck": [((1, 0, 0), 3)],
            "Head": [((1, 0, 0), 4), ((0, 1, 0), 1)],
            "LeftShoulder": [((0, 0, 1), -1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -24)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -10)],
            "LeftHand": [((1, 0, 0), -3)],
            "RightArm": [((0, 1, 0), 20)],
            "RightForeArm": [((0, 1, 0), 108)], "RightHand": [((0, 1, 0), -5)],
        }),
        (36, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 2), ((0, 1, 0), 2)],
            "LeftShoulder": [((0, 0, 1), -1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -24)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -10)],
            "LeftHand": [((1, 0, 0), -3)],
            "RightArm": [((0, 1, 0), 18)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -10)],
        }),
        (54, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 1), ((0, 1, 0), -1)],
            "LeftShoulder": [((0, 0, 1), -1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -24)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -10)],
            "LeftHand": [((1, 0, 0), -3)],
            "RightArm": [((0, 1, 0), 16)],
            "RightForeArm": [((0, 1, 0), 94)], "RightHand": [((0, 1, 0), -12)],
        }),
        (72, {
            "Spine2": [((1, 0, 0), 1)], "Neck": [((1, 0, 0), 2)],
            "Head": [((1, 0, 0), 2), ((0, 1, 0), 2)],
            "LeftShoulder": [((0, 0, 1), -1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -24)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -10)],
            "LeftHand": [((1, 0, 0), -3)],
            "RightArm": [((0, 1, 0), 18)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -10)],
        }),
    ],
)

make_action(
    "Music",
    (
        "Hips", "Spine1", "Spine2", "Neck", "Head", "LeftShoulder",
        "RightShoulder", "LeftArm", "RightArm", "LeftForeArm", "RightForeArm",
        "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg",
    ),
    [
        (1, {
            "Hips": [((0, 1, 0), -2)], "Spine1": [((0, 1, 0), -4)],
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((1, 0, 0), 1)],
            "LeftShoulder": [((0, 0, 1), -2)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 0, 1), -6)], "RightArm": [((0, 0, 1), 2)],
            "LeftForeArm": [((0, 0, 1), -3)], "RightForeArm": [((0, 0, 1), 1)],
            "LeftUpLeg": [((1, 0, 0), 2)], "RightUpLeg": [((1, 0, 0), -1)],
            "LeftLeg": [((1, 0, 0), -3)],
        }),
        (9, {
            "Hips": [((0, 1, 0), -1)], "Spine1": [((0, 1, 0), -2)],
            "Spine2": [((0, 1, 0), -1)], "Head": [((0, 1, 0), 2), ((1, 0, 0), -2)],
            "LeftArm": [((0, 0, 1), -3)], "RightArm": [((0, 0, 1), 3)],
            "LeftLeg": [((1, 0, 0), -1)], "RightLeg": [((1, 0, 0), -2)],
        }),
        (18, {
            "Hips": [((0, 1, 0), 2)], "Spine1": [((0, 1, 0), 4)],
            "Spine2": [((0, 1, 0), 2)], "Head": [((0, 1, 0), -4), ((1, 0, 0), 1)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 2)],
            "LeftArm": [((0, 0, 1), -2)], "RightArm": [((0, 0, 1), 6)],
            "LeftForeArm": [((0, 0, 1), -1)], "RightForeArm": [((0, 0, 1), 3)],
            "LeftUpLeg": [((1, 0, 0), -1)], "RightUpLeg": [((1, 0, 0), 2)],
            "RightLeg": [((1, 0, 0), -3)],
        }),
        (27, {
            "Hips": [((0, 1, 0), 1)], "Spine1": [((0, 1, 0), 2)],
            "Spine2": [((0, 1, 0), 1)], "Head": [((0, 1, 0), -2), ((1, 0, 0), -2)],
            "LeftArm": [((0, 0, 1), -3)], "RightArm": [((0, 0, 1), 3)],
            "LeftLeg": [((1, 0, 0), -2)], "RightLeg": [((1, 0, 0), -1)],
        }),
        (36, {
            "Hips": [((0, 1, 0), -2)], "Spine1": [((0, 1, 0), -4)],
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((1, 0, 0), 1)],
            "LeftShoulder": [((0, 0, 1), -2)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 0, 1), -6)], "RightArm": [((0, 0, 1), 2)],
            "LeftForeArm": [((0, 0, 1), -3)], "RightForeArm": [((0, 0, 1), 1)],
            "LeftUpLeg": [((1, 0, 0), 2)], "RightUpLeg": [((1, 0, 0), -1)],
            "LeftLeg": [((1, 0, 0), -3)],
        }),
    ],
)

make_action(
    "Rest",
    ("Spine1", "Spine2", "Neck", "Head"),
    [
        (1, {"Spine1": [((0, 1, 0), -2)], "Head": [((1, 0, 0), 2)]}),
        (24, {"Spine1": [((0, 1, 0), -4)], "Spine2": [((0, 1, 0), -3)], "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 10)]}),
        (48, {"Spine1": [((0, 1, 0), -2)], "Head": [((1, 0, 0), 2)]}),
    ],
)

make_action(
    "Laptop",
    (
        "Spine1", "Spine2", "Neck", "Head", "LeftShoulder", "RightShoulder",
        "LeftArm", "RightArm", "LeftForeArm", "RightForeArm", "LeftHand", "RightHand",
    ),
    [
        (1, {
            "Spine1": [((1, 0, 0), 4)], "Spine2": [((1, 0, 0), 5)],
            "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 7)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -28)],
            "RightArm": [((0, 1, 0), -16), ((1, 0, 0), -28)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -12)],
            "RightForeArm": [((0, 1, 0), -34), ((1, 0, 0), -12)],
            "LeftHand": [((1, 0, 0), -5)], "RightHand": [((1, 0, 0), 5)],
        }),
        (16, {
            "Spine1": [((1, 0, 0), 4)], "Spine2": [((1, 0, 0), 5)],
            "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 8), ((0, 0, 1), -1)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 1, 0), 14), ((1, 0, 0), -28)],
            "RightArm": [((0, 1, 0), -14), ((1, 0, 0), -28)],
            "LeftForeArm": [((0, 1, 0), 36), ((1, 0, 0), -12)],
            "RightForeArm": [((0, 1, 0), -36), ((1, 0, 0), -12)],
            "LeftHand": [((1, 0, 0), 2)], "RightHand": [((1, 0, 0), -2)],
        }),
        (30, {
            "Spine1": [((1, 0, 0), 4)], "Spine2": [((1, 0, 0), 5)],
            "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 8), ((0, 0, 1), 2)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 1, 0), 18), ((1, 0, 0), -28)],
            "RightArm": [((0, 1, 0), -18), ((1, 0, 0), -28)],
            "LeftForeArm": [((0, 1, 0), 32), ((1, 0, 0), -12)],
            "RightForeArm": [((0, 1, 0), -32), ((1, 0, 0), -12)],
            "LeftHand": [((1, 0, 0), -2)], "RightHand": [((1, 0, 0), 2)],
        }),
        (45, {
            "Spine1": [((1, 0, 0), 4)], "Spine2": [((1, 0, 0), 5)],
            "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 8), ((0, 0, 1), -1)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 1, 0), 14), ((1, 0, 0), -28)],
            "RightArm": [((0, 1, 0), -14), ((1, 0, 0), -28)],
            "LeftForeArm": [((0, 1, 0), 36), ((1, 0, 0), -12)],
            "RightForeArm": [((0, 1, 0), -36), ((1, 0, 0), -12)],
            "LeftHand": [((1, 0, 0), 2)], "RightHand": [((1, 0, 0), -2)],
        }),
        (60, {
            "Spine1": [((1, 0, 0), 4)], "Spine2": [((1, 0, 0), 5)],
            "Neck": [((1, 0, 0), 5)], "Head": [((1, 0, 0), 7)],
            "LeftShoulder": [((0, 0, 1), -1)], "RightShoulder": [((0, 0, 1), 1)],
            "LeftArm": [((0, 1, 0), 16), ((1, 0, 0), -28)],
            "RightArm": [((0, 1, 0), -16), ((1, 0, 0), -28)],
            "LeftForeArm": [((0, 1, 0), 34), ((1, 0, 0), -12)],
            "RightForeArm": [((0, 1, 0), -34), ((1, 0, 0), -12)],
            "LeftHand": [((1, 0, 0), -5)], "RightHand": [((1, 0, 0), 5)],
        }),
    ],
)

make_action(
    "Wave",
    ("Spine2", "Neck", "Head", "RightArm", "RightForeArm", "RightHand"),
    [
        (1, {
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((0, 0, 1), -2)],
            "RightArm": [((0, 1, 0), 20)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -22)],
        }),
        (10, {
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((0, 0, 1), -2)],
            "RightArm": [((0, 1, 0), 22)],
            "RightForeArm": [((0, 1, 0), 98)], "RightHand": [((0, 1, 0), 22)],
        }),
        (20, {
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((0, 0, 1), -2)],
            "RightArm": [((0, 1, 0), 20)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -22)],
        }),
        (30, {
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((0, 0, 1), -2)],
            "RightArm": [((0, 1, 0), 22)],
            "RightForeArm": [((0, 1, 0), 98)], "RightHand": [((0, 1, 0), 22)],
        }),
        (40, {
            "Spine2": [((0, 1, 0), -2)], "Head": [((0, 1, 0), 4), ((0, 0, 1), -2)],
            "RightArm": [((0, 1, 0), 20)],
            "RightForeArm": [((0, 1, 0), 102)], "RightHand": [((0, 1, 0), -22)],
        }),
    ],
)

make_action(
    "Stretch",
    ("Spine1", "Spine2", "Neck", "Head", "LeftShoulder", "RightShoulder", "LeftArm", "RightArm", "LeftForeArm", "RightForeArm"),
    [
        (1, {
            "Spine1": [((1, 0, 0), -2)], "Spine2": [((1, 0, 0), -3)],
            "Neck": [((1, 0, 0), -2)], "Head": [((1, 0, 0), -4)],
            "LeftShoulder": [((0, 0, 1), -8)], "RightShoulder": [((0, 0, 1), 8)],
            "LeftArm": [((0, 0, 1), -104)], "RightArm": [((0, 0, 1), 104)],
            "LeftForeArm": [((0, 0, 1), -12)], "RightForeArm": [((0, 0, 1), 12)],
        }),
        (24, {
            "Spine1": [((1, 0, 0), -5)], "Spine2": [((1, 0, 0), -6)],
            "Neck": [((1, 0, 0), -4)], "Head": [((1, 0, 0), -7), ((0, 0, 1), 2)],
            "LeftShoulder": [((0, 0, 1), -10)], "RightShoulder": [((0, 0, 1), 10)],
            "LeftArm": [((0, 0, 1), -116)], "RightArm": [((0, 0, 1), 116)],
            "LeftForeArm": [((0, 0, 1), -8)], "RightForeArm": [((0, 0, 1), 8)],
        }),
        (48, {
            "Spine1": [((1, 0, 0), -2)], "Spine2": [((1, 0, 0), -3)],
            "Neck": [((1, 0, 0), -2)], "Head": [((1, 0, 0), -4)],
            "LeftShoulder": [((0, 0, 1), -8)], "RightShoulder": [((0, 0, 1), 8)],
            "LeftArm": [((0, 0, 1), -104)], "RightArm": [((0, 0, 1), 104)],
            "LeftForeArm": [((0, 0, 1), -12)], "RightForeArm": [((0, 0, 1), 12)],
        }),
    ],
)

make_action(
    "Look",
    ("Spine2", "Neck", "Head"),
    [
        (1, {"Spine2": [((0, 1, 0), -2)], "Neck": [((0, 1, 0), -5)], "Head": [((0, 1, 0), -10)]}),
        (26, {"Spine2": [((0, 1, 0), 1)], "Neck": [((0, 1, 0), 0)], "Head": [((0, 1, 0), 0), ((0, 0, 1), 2)]}),
        (52, {"Spine2": [((0, 1, 0), 2)], "Neck": [((0, 1, 0), 5)], "Head": [((0, 1, 0), 10)]}),
        (78, {"Spine2": [((0, 1, 0), -2)], "Neck": [((0, 1, 0), -5)], "Head": [((0, 1, 0), -10)]}),
    ],
)

make_action(
    "Happy",
    ("Hips", "Spine1", "Spine2", "Head", "LeftArm", "RightArm", "LeftForeArm", "RightForeArm", "LeftLeg", "RightLeg"),
    [
        (1, {
            "Hips": [((0, 1, 0), -2)], "Spine1": [((0, 1, 0), -3)], "Head": [((0, 0, 1), -3)],
            "LeftArm": [((0, 0, 1), -20)], "RightArm": [((0, 0, 1), 12)],
            "LeftForeArm": [((0, 0, 1), -8)], "RightForeArm": [((0, 0, 1), 5)],
            "LeftLeg": [((1, 0, 0), -5)],
        }),
        (14, {
            "Hips": [((0, 1, 0), 2)], "Spine1": [((0, 1, 0), 3)], "Head": [((0, 0, 1), 3)],
            "LeftArm": [((0, 0, 1), -12)], "RightArm": [((0, 0, 1), 20)],
            "LeftForeArm": [((0, 0, 1), -5)], "RightForeArm": [((0, 0, 1), 8)],
            "RightLeg": [((1, 0, 0), -5)],
        }),
        (28, {
            "Hips": [((0, 1, 0), -2)], "Spine1": [((0, 1, 0), -3)], "Head": [((0, 0, 1), -3)],
            "LeftArm": [((0, 0, 1), -20)], "RightArm": [((0, 0, 1), 12)],
            "LeftForeArm": [((0, 0, 1), -8)], "RightForeArm": [((0, 0, 1), 5)],
            "LeftLeg": [((1, 0, 0), -5)],
        }),
    ],
)

armature.animation_data.action = None
reset_pose()

# The source embeds 4K textures.  A 170px desktop pet does not benefit from
# them, so resize in Blender before packing the GLB.  This keeps page startup
# quick without touching the character mesh or animation curves.
for image in bpy.data.images:
    if image.size[0] > 1024 or image.size[1] > 1024:
        image.scale(1024, 1024)

bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_extra_animations=True,
    export_force_sampling=True,
    export_optimize_animation_size=True,
    export_skins=True,
)

print("PANGBOBO_ACTIONS=" + ",".join(sorted(action.name for action in bpy.data.actions)))
