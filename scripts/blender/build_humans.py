# Builds the two realistic exercise models (woman, man) with MPFB / MakeHuman CC0 assets and
# exports them as rigged glTF binaries for the app (public/models/<model>.glb).
#
#   blender -b --python scripts/blender/build_humans.py -- <output dir> [female|male]
#
# Body shape comes from MakeHuman macros; skin, eyes, hair and clothes are CC0 system assets.
# The rig is MPFB's Mixamo-compatible skeleton (mixamorig:* bone names), which the app drives
# from the exercise poses. Targets and helper geometry are baked away so the file is a plain
# skinned mesh; textures are downscaled to 1024 px and stored as WebP to keep the download small.
import os
import sys

import bpy

from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.services.exportservice import ExportService
from bl_ext.blender_org.mpfb.services.objectservice import ObjectService

args = sys.argv[sys.argv.index("--") + 1:]
out_dir = args[0]
which = args[1:] or ["female", "male"]

COMMON = {
    "eyes": "high-poly/high-poly.mhclo",
    "eyebrows": "eyebrow001/eyebrow001.mhclo",
    "eyelashes": "eyelashes01/eyelashes01.mhclo",
    "teeth": "teeth_base/teeth_base.mhclo",
    "tongue": "",
    "rig": "mixamo",
    "skin_material_type": "MAKESKIN",
    "eyes_material_type": "MAKESKIN",
    "eyes_material_settings": {},
    "skin_material_settings": {},
    "alternative_materials": {},
    "targets": [],
    "expressions": [],
    "proxy": "",
}


def both(central, sided):
    """Target stack: central targets as given, sided ones applied to the left and right alike."""
    out = [{"target": k, "value": v} for k, v in central.items()]
    for k, v in sided.items():
        out += [{"target": f"l-{k}", "value": v}, {"target": f"r-{k}", "value": v}]
    return out


MODELS = {
    "female": {
        "phenotype": {"gender": 0.0, "age": 0.5, "muscle": 0.62, "weight": 0.42, "proportions": 1.0, "height": 0.55,
                      "cupsize": 0.45, "firmness": 0.7, "race": {"asian": 0.1, "caucasian": 0.8, "african": 0.1}},
        "skin_mhmat": "young_caucasian_female/young_caucasian_female.mhmat",
        "hair": "ponytail01/ponytail01.mhclo",
        "clothes": ["female_sportsuit01/female_sportsuit01.mhclo", "shoes05/shoes05.mhclo"],
        # an active woman: toned abdomen, defined shoulders, thighs and calves, slight V
        "targets": both({"stomach-tone-incr": 0.5, "buttocks-volume-incr": 0.15, "torso-vshape-incr": 0.08},
                        {"upperarm-shoulder-muscle-incr": 0.25, "upperarm-muscle-incr": 0.15, "upperleg-muscle-incr": 0.2,
                         "lowerleg-muscle-incr": 0.3}),
    },
    "male": {
        "phenotype": {"gender": 1.0, "age": 0.5, "muscle": 0.7, "weight": 0.45, "proportions": 1.0, "height": 0.55,
                      "cupsize": 0.5, "firmness": 0.5, "race": {"asian": 0.1, "caucasian": 0.8, "african": 0.1}},
        "skin_mhmat": "young_caucasian_male/young_caucasian_male.mhmat",
        "hair": "short04/short04.mhclo",
        "clothes": ["male_casualsuit04/male_casualsuit04.mhclo", "shoes06/shoes06.mhclo"],
        # an athletic man: chest, lats and a V-shaped back, shoulders, arms, thighs and calves
        "targets": both({"stomach-tone-incr": 0.6, "torso-muscle-pectoral-incr": 0.4, "torso-muscle-dorsi-incr": 0.35,
                         "torso-vshape-incr": 0.3},
                        {"upperarm-shoulder-muscle-incr": 0.45, "upperarm-muscle-incr": 0.35, "lowerarm-muscle-incr": 0.3,
                         "upperleg-muscle-incr": 0.3, "lowerleg-muscle-incr": 0.4}),
    },
}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.armatures):
        for block in list(coll):
            if block.users == 0:
                coll.remove(block)


def build(name):
    clear_scene()
    info = dict(COMMON)
    info.update(MODELS[name])
    info["name"] = name
    settings = HumanService.get_default_deserialization_settings()
    # one level of subdivision, baked: rounder joints and muscles instead of a faceted low-poly look
    settings["subdiv_levels"] = 1
    settings["override_skin_model"] = "MAKESKIN"
    basemesh = HumanService.deserialize_from_dict(info, settings)

    # bake body shape and drop helper geometry (and the parts hidden under clothes)
    TargetService.bake_targets(basemesh)
    ExportService.bake_modifiers_remove_helpers(basemesh, bake_masks=True, bake_subdiv=True, remove_helpers=True, also_proxy=True)

    # small, web-friendly textures
    # (the skin keeps 2048 px: it covers the face, hands and arms seen up close)
    for img in bpy.data.images:
        limit = 2048 if "skin" in img.name.lower() or "caucasian" in img.name.lower() else 1024
        if img.size[0] > limit:
            img.scale(limit, max(1, int(img.size[1] * limit / img.size[0])))

    # Only hair-like parts need transparency, and a cutout (alpha clip) is enough: alpha *blending*
    # breaks depth sorting, letting inner surfaces show through the skin. Everything else is opaque.
    cutout = ("eyebrow", "eyelash", "ponytail", "short0", "hair", "high-poly")
    for o in list(bpy.data.objects):
        if o.type == "MESH" and ("teeth" in o.name or "tongue" in o.name):
            bpy.data.objects.remove(o, do_unlink=True)
    for m in bpy.data.materials:
        if not m.node_tree:
            continue
        bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if any(c in m.name for c in cutout):
            m.surface_render_method = "DITHERED"
            m.blend_method = "CLIP"
            m.alpha_threshold = 0.4
        else:
            m.surface_render_method = "DITHERED"
            m.blend_method = "OPAQUE"
            if bsdf and bsdf.inputs["Alpha"].is_linked:
                m.node_tree.links.remove(bsdf.inputs["Alpha"].links[0])
                bsdf.inputs["Alpha"].default_value = 1.0

    rig = ObjectService.find_object_of_type_amongst_nearest_relatives(basemesh, "Skeleton")
    print(f"[kanga] {name}: rig={rig.name if rig else None} bones={len(rig.data.bones) if rig else 0}")
    for o in bpy.data.objects:
        print(f"[kanga]   object {o.name} type={o.type} verts={len(o.data.vertices) if o.type == 'MESH' else '-'}")

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_image_format="WEBP",
        export_image_quality=80,
        export_skins=True,
        export_morph=False,
        export_animations=False,
        export_apply=False,
        export_yup=True,
    )
    print(f"[kanga] wrote {path} ({os.path.getsize(path) // 1024} KB)")


for n in which:
    build(n)
