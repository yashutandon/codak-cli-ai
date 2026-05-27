export function Header() {
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
        borderColor: "#1E3A5F",
        titleAlignment: "center",
        bottomTitleAlignment: "center",
      }}
    >
      <ascii-font
        font="tiny"
        text="Codak"
        color="#4A9EFF"
      />
     
    </box>
  )
}