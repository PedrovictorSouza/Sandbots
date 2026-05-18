import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "../story/sandbotsLexicon.js";

export const SMALL_ISLAND_DIALOGUES = Object.freeze({
  chopperOnboarding: {
    id: "chopperOnboarding",
    speakerId: "chopper",
    lines: [
      {
        text: "Hey, rookie. Welcome to your first day on the job.",
        givesQuest: "wake-guide"
      },
      {
        text: "Tiny scheduling note: your first day was 2,000 years ago.",
        givesQuest: "wake-guide"
      },
      {
        text: "So, technically, you're not late. You're historically late.",
        givesQuest: "wake-guide"
      },
      {
        text: "Our human, Bill, waited as long as he could. Very patient man. Very limited warranty.",
        givesQuest: "wake-guide"
      },
      {
        text: "In his final years, he mentioned you a lot. Usually to complain about your delivery time, your build quality, and your complete lack of punctuality.",
        givesQuest: "wake-guide"
      },
      {
        text: "His last recorded message was: 'If that walking toaster ever wakes up, tell him he's fired.'",
        givesQuest: "wake-guide"
      },
      {
        text: "Anyway, you're promoted. Mostly because everyone else is dust.",
        givesQuest: "wake-guide"
      },
      {
        text: "Well, there's a lot to do, so let's get going."
      },
      {
        id: "notice-squirtle-sound",
        text: "First things first. See that collapsed Hydro Bot? If we wake it, water circulation can start again."
      },
      {
        text: "Before we move, register your Builder frame callsign. What should we call you?"
      }
    ]
  },
  strandedHelperDiscovery: {
    id: "strandedHelperDiscovery",
    speakerId: SANDBOTS_BOT_NAMES.hydro,
    lines: [
      {
        text: "Hydro core online. I am Piper, apparently."
      },
      {
        speakerId: "chopper",
        text: "It was built to wash salts out of the topsoil."
      },
      {
        text: "Press LT near dead ground and start hydrating this planet already, my friend.",
        completesQuest: "record-a-memory"
      },
      {
        speakerId: "",
        text: `Hydro Bot is online. ${SANDBOTS_ITEM_NAMES.hydroTool} can restore dry patches.`,
        completesQuest: "gather-first-supplies"
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
        text: `Seeing such fresh, green tall grass makes me feel like ${SANDBOTS_WORLD_TERMS.bots} might return to work at any moment...`
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
        text: `${SANDBOTS_BOT_NAMES.grow} is tracking the restored patches. Keep the route small and visible; ask me if the Workbench gets confusing.`
      }
    ]
  },
  leafHelperHabitat: {
    id: "leafHelperHabitat",
    speakerId: SANDBOTS_BOT_NAMES.grow,
    lines: [
      {
        text: "Signal stabilized. This grass patch is small, but it can hold moisture."
      },
      {
        text: `I can seed plant kits here once ${SANDBOTS_BOT_NAMES.hydro} has hydrated the ground.`
      }
    ]
  },
  bulbasaurDryGrassRequest: {
    id: "bulbasaurDryGrassRequest",
    speakerId: SANDBOTS_BOT_NAMES.grow,
    lines: [
      {
        text: "The soil is still dry. My grow routines keep failing before the roots take."
      },
      {
        text: `Restore the dry tall grass with ${SANDBOTS_ITEM_NAMES.hydroTool}, then I can teach you a growth protocol.`
      },
      {
        text: "Ten patches should prove the habitat can breathe again."
      }
    ]
  },
  bulbasaurLeafageReward: {
    id: "bulbasaurLeafageReward",
    speakerId: SANDBOTS_BOT_NAMES.grow,
    lines: [
      {
        text: "The patch is holding water. That is enough for a first grow loop."
      },
      {
        text: "Watch the ground, not me. The useful part happens under the roots."
      },
      {
        text: `This is ${SANDBOTS_ITEM_NAMES.growTool}! Use it to grow tall grass one square at a time.`
      },
      {
        speakerId: "",
        text: `You learned ${SANDBOTS_ITEM_NAMES.growTool}.`
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
