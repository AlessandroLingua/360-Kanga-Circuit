# Renders a front and a side preview of an exported model (for checking the look).
#   blender -b --python scripts/blender/preview.py -- <model.glb> <out_prefix>
import math
import sys

import bpy

glb, out = sys.argv[sys.argv.index("--") + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x, scene.render.resolution_y = 600, 900
scene.world = bpy.data.worlds.new("w")
scene.world.color = (0.12, 0.12, 0.14)

meshes = [o for o in scene.objects if o.type == "MESH"]
zmax = max((o.matrix_world @ v.co).z for o in meshes for v in o.data.vertices)
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 60
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
for name, (x, y, e) in {"key": (3, -4, 900), "fill": (-4, -2, 400), "rim": (0, 5, 600)}.items():
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = e
    ld.size = 3
    lo = bpy.data.objects.new(name, ld)
    lo.location = (x, y, zmax * 0.8)
    lo.rotation_euler = (math.radians(70), 0, math.atan2(x, -y))
    scene.collection.objects.link(lo)

for view, (x, y, rz) in {"front": (0, -5.2, 0), "side": (5.2, 0, 90)}.items():
    cam.location = (x, y, zmax * 0.55)
    cam.rotation_euler = (math.radians(90), 0, math.radians(rz))
    scene.render.filepath = f"{out}-{view}.png"
    bpy.ops.render.render(write_still=True)
    print("[kanga] rendered", scene.render.filepath)
