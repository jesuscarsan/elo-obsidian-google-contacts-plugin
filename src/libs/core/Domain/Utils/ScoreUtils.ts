/**
 * Ensures importance is between 1 and 5.
 * @param importance The raw importance score.
 * @returns A number between 1 and 5.
 */
export function normalizeImportance(importance: number): number {
    if (importance <= 1) return 1;
    if (importance >= 5) return 5;
    return Math.round(importance);
}

/**
 * Ensures difficulty is between 1 and 3.
 */
export function normalizeDifficulty(difficulty: number): number {
    if (difficulty <= 1) return 1;
    if (difficulty >= 3) return 3;
    return Math.round(difficulty);
}

/**
 * Converts a difficulty score (1-3) to a mapped color.
 * 1: Baja (Green)
 * 2: Media (Orange)
 * 3: Alta (Red)
 */
export function difficultyToColor(difficulty: number): string {
    const normalized = normalizeDifficulty(difficulty);
    if (normalized === 1) return '#50fa7b'; // Green
    if (normalized === 2) return '#ffb86c'; // Orange
    return '#ff5555'; // Red
}
