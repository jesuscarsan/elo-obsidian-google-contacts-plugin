import { App, MarkdownView, TFile } from 'obsidian';

/**
 * Helper to get the active MarkdownView, supporting specific file targeting and fallback
 * for when focus is in a side panel.
 */
export function getActiveMarkdownView(app: App, targetFile?: TFile): MarkdownView | null {
    if (targetFile) {
        const leaves = app.workspace.getLeavesOfType('markdown');
        const matchingLeaf = leaves.find(leaf => (leaf.view as MarkdownView).file === targetFile);
        return matchingLeaf ? (matchingLeaf.view as MarkdownView) : null;
    }

    let view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
        const activeFile = app.workspace.getActiveFile();
        if (activeFile && activeFile.extension === 'md') {
            const leaves = app.workspace.getLeavesOfType('markdown');
            const matchingLeaf = leaves.find(leaf => (leaf.view as MarkdownView).file === activeFile);
            if (matchingLeaf) {
                view = matchingLeaf.view as MarkdownView;
            }
        }
    }
    return view;
}

/**
 * Executes an action in edit (source) mode and ensures the view returns to preview mode afterwards.
 * 
 * @param view The MarkdownView to operate on.
 * @param action The async action to execute while in edit mode.
 */
export async function executeInEditMode(view: MarkdownView, action: () => Promise<void>): Promise<void> {
    const originalMode = view.getMode();

    // Switch to source mode if not already there
    if (originalMode !== 'source') {
        await view.setState({ ...view.getState(), mode: 'source' }, { history: false });
        // Small delay to ensure state transition settles if needed, though await should handle it.
    }

    try {
        await action();
    } finally {
        // Always switch to preview mode at the end, as requested.
        if (originalMode !== 'source' && view.getMode() !== 'preview') {
            await view.setState({ ...view.getState(), mode: 'preview' }, { history: false });
        }
    }
}
