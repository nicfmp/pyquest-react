export const mockProgress = {
  1: { completedChallenges: 0, xp: 0 },
  2: { completedChallenges: 0, xp: 0 },
  3: { completedChallenges: 0, xp: 0 },
  4: { completedChallenges: 0, xp: 0 },
}

export function buildQuestProgress(quests, progressById) {
  const source = progressById || mockProgress
  let previousCompleted = true

  return quests.map((q) => {
    const progress = source[q.id] || { completedChallenges: 0, xp: 0 }
    const isComplete = progress.completedChallenges >= q.totalChallenges
    const locked = !previousCompleted
    previousCompleted = isComplete

    return {
      ...q,
      completedChallenges: progress.completedChallenges,
      xp: progress.xp,
      isComplete,
      locked,
    }
  })
}
