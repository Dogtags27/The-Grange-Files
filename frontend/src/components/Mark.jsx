export default function Mark({ kind }) {
  if (kind === "yes") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 8.2 L6.4 11.6 L13 4.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
      </svg>
    )
  }
  if (kind === "no") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
      </svg>
    )
  }
  return null
}
