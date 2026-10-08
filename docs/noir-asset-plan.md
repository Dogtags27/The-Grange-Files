# Noir desk: assets and pipeline

## Source

Detective Office LowPoly Pack by Tarasov (paid game-asset licence, bought for this project). The original archive stays out of git (`docs/assets/*.rar` is ignored). Only the converted `frontend/public/assets/noir/props.glb` ships.

## Rebuilding props.glb

1. Extract the archive with `tar -xf` into a scratch folder.
2. In a scratch folder outside the repo run `npm i fbx2gltf @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions sharp`.
3. Point `docs/noir/build-props.mjs` at the extracted `FBX` and `Textures` folders and run it with Node.
4. Copy `out/props.glb` to `frontend/public/assets/noir/props.glb`.

The script converts 20 FBX props, applies the shared atlas and emissive map as WebP, and merges everything into one file of about 400 KB.

## Where it appears

- Home: a dim desk with five mugshot cards. A lamp light drifts across them.
- Lineup: the same desk. Clicking a card (or arrow keys on the hidden radio group) circles it, the light moves onto it and the other cards dim. Table votes show the voters' names on the card plate.
- Reveal: the light searches the cards while the Mayor talks, then lands on the accused with a red circle. A guilty verdict warms the light, a not guilty verdict turns it cold.

## Guardrails

- The live grid never loads 3D.
- The scene is code split. Without WebGL, with Save-Data, or if loading fails, the original paper lineup is used.
- Frames render on demand and stop when the scene leaves the screen. Reduced motion removes the sway, the light travel and the circle animation.
- Mugshot cards are drawn at runtime from the existing Open Peeps portraits. No hand-made art.

## Acknowledgements to add later

Detective Office LowPoly Pack by Tarasov, Open Peeps by Pablo Stanley via DiceBear, Fraunces and Atkinson Hyperlegible.
