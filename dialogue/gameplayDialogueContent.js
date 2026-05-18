import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "../app/story/sandbotsLexicon.js";

export const TANGROWTH_ONBOARDING_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Impact confirmed. Something survived the landing, which is inconveniently useful."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "A Builder made it. Good. The colony still has one pair of hands, statistically speaking."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "This planet was meant to become a human outpost. At present, it is mostly dust with intentions."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "We restore power, water, soil, and shelter. Then maybe humans can arrive without immediately regretting it."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "You are not fully calibrated, but neither is the planet. That gives us thematic consistency."
  },
  {
    id: "ask-player-name",
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Before we run off, what should I call you?"
  },
  {
    id: "notice-squirtle-sound",
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: `That distress ping is coming from a helper bot. Come on, ${SANDBOTS_BOT_NAMES.scout} can triangulate it.`
  }
];

export const SQUIRTLE_DISCOVERY_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.hydro,
    text: "nnng...Wa...water..."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: `That's ${SANDBOTS_BOT_NAMES.hydro}. Its tank is nearly dry, which is not ideal for someone named Hydro.`
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "If we get its pump moving, it can help restore dry ground around the base."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.hydro,
    text: "Rrrgh... usually I can push water through the nozzle..."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.hydro,
    text: "Ahh, if only there were... another helpful Builder around to prime the pump..."
  },
  {
    speaker: "",
    text: `${SANDBOTS_ITEM_NAMES.hydroTool} is ready.`
  },
  {
    speaker: SANDBOTS_BOT_NAMES.hydro,
    text: "I'm saved, thank you! I really thought I was done for."
  },
  {
    speaker: SANDBOTS_BOT_NAMES.hydro,
    text: "I owe you one... Huh? Something's beeping..."
  },
  {
    speaker: "",
    text: `You found a ${SANDBOTS_WORLD_TERMS.codex}. It still has a working entry for the bot you just helped.`
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Keep it with you. It keeps notes on bot repairs, habitat checks, and small tragedies in tidy columns."
  }
];

export const TANGROWTH_FLOWER_RECOVERY_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Back in the day, there was tall grass like this all over the place around here!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Seeing fresh green ground makes me think the old bot routes might wake up again."
  }
];

export const TANGROWTH_TALL_GRASS_RETURN_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Ahh, you've restored a tall grass habitat!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Now that it exists, dormant bots may have somewhere safe to wake up. Let's watch the grass for bad decisions."
  }
];

export const TANGROWTH_TALL_GRASS_MEMORY_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Ohh, this brings back memories!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Back in the day, there was tall grass like this all over the place around here!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.overseer,
    text: "Fresh green ground means the planet is remembering how to host workers again."
  }
];

export const CHOPPER_BULBASAUR_ENCOURAGEMENT_DIALOGUE = [
  {
    speaker: "Chopper",
    text: "Seems like you're doing a great job, if you want something, just ask me"
  }
];

export const BULBASAUR_HABITAT_DISCOVERY_DIALOGUE = [
  {
    speaker: "Chopper",
    text: `That old repair pod just woke up. The island infrastructure still remembers ${SANDBOTS_BOT_NAMES.grow}.`
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "Yippee! Nice to meet you! This plot of tall grass is kinda small, but I like it!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "I love leaves and grass and viable substrate. That last one sounds less cute, but it matters."
  }
];

export const BULBASAUR_DRY_GRASS_REQUEST_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "The ground here is too dry, and the grass is all wilty, and... And it's nothing like where I lived before!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "Can you help? Would you water the dry tall grass? Please?"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: `If you do that, I can share my ${SANDBOTS_ITEM_NAMES.growTool} routine. It makes sad ground less sad.`
  }
];

export const BULBASAUR_LEAFAGE_REWARD_DIALOGUE = [
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "You did it! The tall grass feels soft and springy again!"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: "A promise is a promise. Watch closely, okay?"
  },
  {
    speaker: SANDBOTS_BOT_NAMES.grow,
    text: `This is ${SANDBOTS_ITEM_NAMES.growTool}. Use it to grow tall grass one square at a time.`
  },
  {
    speaker: "",
    text: `You learned ${SANDBOTS_ITEM_NAMES.growTool}.`
  }
];
