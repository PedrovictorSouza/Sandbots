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
  chopperTallGrassHabitatRestored: {
    id: "chopperTallGrassHabitatRestored",
    speakerId: "chopper",
    lines: [
      {
        text: "Ohh, this brings back memories!"
      },
      {
        text: "Back in the day, there was tall grass like this all over the place around here!"
      },
      {
        text: "Seeing such fresh, green tall grass makes me feel like Pokemon might return at any moment..."
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
  chopperBulbasaurEncouragement: {
    id: "chopperBulbasaurEncouragement",
    speakerId: "chopper",
    lines: [
      {
        text: "Seems like you're doing a great job, if you want something, just ask me"
      }
    ]
  },
  leafHelperHabitat: {
    id: "leafHelperHabitat",
    speakerId: "bulbasaur",
    lines: [
      {
        text: "Yippee! Nice to meet you! This plot of tall grass is kinda small, but I like it!"
      },
      {
        text: "I love leaves and grass and stuff. And living by lotsa green things!"
      }
    ]
  },
  bulbasaurDryGrassRequest: {
    id: "bulbasaurDryGrassRequest",
    speakerId: "bulbasaur",
    lines: [
      {
        text: "The ground here is too dry, and the grass is all wilty, and... And it's nothing like where I lived before!"
      },
      {
        text: "Can you help? Would you water the dry tall grass? Please?"
      },
      {
        text: "If you do that, I'll teach you something really neat"
      }
    ]
  },
  bulbasaurLeafageReward: {
    id: "bulbasaurLeafageReward",
    speakerId: "bulbasaur",
    lines: [
      {
        text: "You did it! The tall grass feels soft and springy again!"
      },
      {
        text: "A promise is a promise. Watch closely, okay?"
      },
      {
        text: "This is Leafage! Use it to grow tall grass one square at a time."
      },
      {
        speakerId: "",
        text: "You learned Leafage."
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
