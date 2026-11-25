"""Build the web asset from the supplied PBR mandap without added decor."""

import os
import bpy

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(PROJECT_ROOT, "blender", "source", "base_basic_pbr.glb")
BLEND_OUT = os.path.join(PROJECT_ROOT, "blender", "bonedi_puja_mandap.blend")
GLB_OUT = os.path.join(PROJECT_ROOT, "src", "assets", "bonedi-puja-mandap.glb")

# Start with the source model only. Its geometry and PBR materials stay intact.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if len(meshes) != 1:
    raise RuntimeError(f"Expected one source mandap mesh, found {len(meshes)}")

model = meshes[0]
model.name = "Bonedi Bari | Main mandap from base_basic_pbr.glb"
model.data.name = "Rodin PBR mandap geometry"

# Save a clean editable Blender project containing the original model only.
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

# Export only the source mesh; imported textures/material maps remain embedded.
bpy.ops.object.select_all(action="DESELECT")
model.select_set(True)
bpy.context.view_layer.objects.active = model
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)
print("EXPORTED", GLB_OUT, "with original PBR materials")
