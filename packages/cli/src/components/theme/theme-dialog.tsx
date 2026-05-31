import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../../providers/dialog";
import { useTheme } from "../../providers/theme";
import { DialogSearchList } from "../common/dialog-search-list";
import { THEMES } from "../../providers/theme/types/theme";
import type { Theme } from "../../providers/theme/types/theme";

export const ThemeDialogContent = () => {
    const dialog = useDialog();
    const { setTheme, currentTheme, colors } = useTheme();
    const originalThemeRef = useRef(currentTheme);
    const confirmRef = useRef(false);

    useEffect(() => {
        return () => {
            if (!confirmRef.current) {
                setTheme(originalThemeRef.current);
            }
        }
    }, [])

    const handleSelect = useCallback((theme: Theme) => {
        confirmRef.current = true;
        setTheme(theme);
        dialog.close();
    }, [setTheme, dialog])

    const handleHighLight = useCallback((theme: Theme) => {
        setTheme(theme);
    }, [setTheme])

    return (
        <DialogSearchList
            items={THEMES}
            onSelect={handleSelect}
            onHighlight={handleHighLight}
            filterFn={(t, query) => t.name.toLowerCase().includes(query.toLowerCase())}
            renderItem={(theme, isSelected) => (
                <text
                    selectable={false}
                    fg={isSelected ? colors.background : colors.thinking}
                >
                    {theme.name === originalThemeRef.current.name ? "\u0020\u2022\u0020" : "\u0020\u0020\u0020"}
                    {theme.name}
                </text>
            )}
            getKey={(t) => t.name}
            placeholder="search themes"
            emptyText="No matching themes"
        />
    )
}