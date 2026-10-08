import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { NodeIO, Document } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { dedup, prune, mergeDocuments } from "@gltf-transform/functions"
import sharp from "sharp"

const T = process.env.TEMP + "/tarasov"
const names = [
  "Desk_01", "Desk_Lamp_01", "Cigarette_Tray_01", "Cigarette_Lit_01", "Cigarette_01",
  "Alcohol_Bottle_01", "Alcohol_Glass_01", "Folder_01", "Folder_02", "Folder_03",
  "Paper_01", "Paper_02", "Paper_03", "Paper_Pile_01", "Paper_Crumpled_01", "Pen_01",
  "Phone_01", "Pinboard_01", "Cup_Coffee_01", "Cigarette_Pack_01",
  "Armchair_01", "Cardboard_Box_01", "Cardboard_Box_02", "Cardboard_Box_03", "Box_01",
]
const exe = path.resolve("node_modules/fbx2gltf/bin/Windows_NT/FBX2glTF.exe")
fs.mkdirSync("out", { recursive: true })

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const out = new Document()
out.createBuffer()
const outScene = out.createScene("props")

const albedo = new Uint8Array(await sharp(`${T}/Textures/Detective Office_Textures.png`).removeAlpha().webp({ quality: 88 }).toBuffer())
const emissive = new Uint8Array(await sharp(`${T}/Textures/Detective Office_Textures_Emissive.png`).removeAlpha().webp({ quality: 88 }).toBuffer())

for (const n of names) {
  execFileSync(exe, ["--binary", "--input", `${T}/FBX/${n}.fbx`, "--output", path.resolve(`out/${n}`)], { stdio: "pipe" })
  const src = await io.read(`out/${n}.glb`)
  const root = src.getRoot()
  const ta = src.createTexture("atlas").setImage(albedo).setMimeType("image/webp")
  const te = src.createTexture("atlas_emissive").setImage(emissive).setMimeType("image/webp")
  const m = src.createMaterial("atlas").setBaseColorTexture(ta).setEmissiveTexture(te).setEmissiveFactor([1, 1, 1]).setRoughnessFactor(0.9).setMetallicFactor(0)
  for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) p.setMaterial(m)
  for (const mm of root.listMaterials()) if (mm !== m) mm.dispose()
  for (const t of root.listTextures()) if (t !== ta && t !== te) t.dispose()
  const before = new Set(out.getRoot().listScenes())
  mergeDocuments(out, src)
  const holder = out.createNode(n)
  for (const sc of out.getRoot().listScenes()) {
    if (before.has(sc)) continue
    for (const c of sc.listChildren()) holder.addChild(c)
    sc.dispose()
  }
  outScene.addChild(holder)
}

await out.transform(dedup(), prune())
{ const bs = out.getRoot().listBuffers(); for (const a of out.getRoot().listAccessors()) a.setBuffer(bs[0]); bs.slice(1).forEach((b) => b.dispose()) }
await io.write("out/props.glb", out)
const info = out.getRoot()
console.log("meshes", info.listMeshes().length, "materials", info.listMaterials().length, "textures", info.listTextures().length)
console.log("bytes", fs.statSync("out/props.glb").size)
for (const n of out.getRoot().listScenes()[0].listChildren()) {
  const b = []
  n.traverse((x) => { if (x.getMesh()) b.push(x.getName()) })
  console.log(n.getName(), b.join(","))
}


