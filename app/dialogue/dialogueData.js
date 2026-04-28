export const SMALL_ISLAND_DIALOGUES = Object.freeze({
  chopperOnboarding: {
    id: "chopperOnboarding",
    speakerId: "chopper",
    lines: [
      {
        text: "Easy there. The island has been quiet for too long, and quiet places forget how to breathe.",
        givesQuest: "wake-guide"
      },
      {
        text: "I heard a weak cry beyond the ash. If someone is still out there, we move now."
      },
      {
        id: "notice-squirtle-sound",
        text: "Huum, what's that sound? Follow it with me. Stay close, and watch the dead ground."
      }
    ]
  },
  strandedHelperDiscovery: {
    id: "strandedHelperDiscovery",
    speakerId: "stranded-helper",
    lines: [
      {
        text: "Water... please..."
      },
      {
        speakerId: "chopper",
        text: "They're almost dry. The island is asking for a tool, not a fight."
      },
      {
        text: "If you can carry this motion, you can wake the soil again.",
        completesQuest: "record-a-memory"
      },
      {
        speakerId: "",
        text: "You learned Water Gun. The field camera has recorded its first memory.",
        completesQuest: "open-the-water-route"
      }
    ]
  },
  chopperTallGrassReturn: {
    id: "chopperTallGrassReturn",
    speakerId: "chopper",
    lines: [
      {
        text: "That patch is alive again. Small green things remember more than we do."
      },
      {
        text: "Keep restoring spaces like this and helpers will find their way home."
      }
    ]
  },
  chopperFlowerRecovery: {
    id: "chopperFlowerRecovery",
    speakerId: "chopper",
    lines: [
      {
        text: "Flowers already? The island is showing off."
      },
      {
        text: "Good. Let it. Hope should be visible from far away."
      }
    ]
  },
  leafHelperHabitat: {
    id: "leafHelperHabitat",
    speakerId: "leaf-helper",
    lines: [
      {
        text: "Yeehp, nice to meet you!"
      },
      {
        text: "This grass is small, but it smells like a home trying to happen."
      },
      {
        text: "Bring more green things together and I bet more helpers will visit."
      }
    ]
  },
  chopperFirstHabitatReport: {
    id: "chopperFirstHabitatReport",
    speakerId: "chopper",
    lines: [
      {
        text: "You felt that too, right? The island answered."
      },
      {
        text: "A patch is not a home yet, but it is the first place that wants to become one."
      },
      {
        text: "Keep listening for helpers. They know what each broken corner needs."
      }
    ]
  }
});
