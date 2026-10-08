import { portrait } from "./portraits"

export default function Figure({ name, size = 184 }) {
  const { uri, scale } = portrait(name)
  const px = size * scale
  return <img src={uri} alt="" width={px} height={px} draggable="false" />
}
