export function validateCompleted(done, snapshotGameweek) {
 if (!done.length || snapshotGameweek < done.at(-1) || done.some((week, index) => week !== index + 1)) throw Error("Completed gameweeks are absent, incomplete or non-contiguous");
}
