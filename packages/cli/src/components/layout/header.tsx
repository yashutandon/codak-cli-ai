import { useTheme } from "../../providers/theme"

export function Header() {
  const { colors } = useTheme()
  return (
    <box
      style={{
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 1,
        paddingBottom: 1,
        gap: 0,
        borderStyle: "double",
        borderColor: colors.primary,
        titleAlignment: "center",
        bottomTitleAlignment: "center",
      }}
    >
      <ascii-font
        font="tiny"
        text="Codak"
        color="#ffffff"
      />
    </box>
  )
}