# Blender (headless): installs a MakeHuman asset pack zip into MPFB's user data folder.
# blender -b --python scripts/blender/install_assets.py -- <pack.zip>
import sys, bpy
zip_path = sys.argv[sys.argv.index("--") + 1]
print("load_pack:", bpy.ops.mpfb.load_pack(filepath=zip_path))
