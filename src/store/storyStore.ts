import { create } from 'zustand'

interface StoryState {
  currentSceneId: string
  currentDialogueIndex: number
  completedScenes: string[]
  playerChoices: Record<string, string>
  storyFlags: Record<string, boolean>

  setCurrentSceneId: (sceneId: string) => void
  setCurrentDialogueIndex: (index: number) => void
  advanceDialogue: () => void
  completeScene: (sceneId: string) => void
  recordChoice: (sceneId: string, choiceId: string) => void
  setStoryFlag: (flagName: string, value: boolean) => void
  resetStory: () => void
}

const INITIAL_STATE = {
  currentSceneId: 'menu',
  currentDialogueIndex: 0,
  completedScenes: [],
  playerChoices: {},
  storyFlags: {},
}

export const useStoryStore = create<StoryState>((set) => ({
  ...INITIAL_STATE,

  setCurrentSceneId: (sceneId) => set({ currentSceneId: sceneId, currentDialogueIndex: 0 }),

  setCurrentDialogueIndex: (index) => set({ currentDialogueIndex: index }),

  advanceDialogue: () =>
    set((state) => ({
      currentDialogueIndex: state.currentDialogueIndex + 1,
    })),

  completeScene: (sceneId) =>
    set((state) => ({
      completedScenes: state.completedScenes.includes(sceneId)
        ? state.completedScenes
        : [...state.completedScenes, sceneId],
    })),

  recordChoice: (sceneId, choiceId) =>
    set((state) => ({
      playerChoices: {
        ...state.playerChoices,
        [sceneId]: choiceId,
      },
    })),

  setStoryFlag: (flagName, value) =>
    set((state) => ({
      storyFlags: {
        ...state.storyFlags,
        [flagName]: value,
      },
    })),

  resetStory: () => set(INITIAL_STATE),
}))
