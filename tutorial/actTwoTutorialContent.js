import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "../app/story/sandbotsLexicon.js";

export const TALK_DISTANCE = 4.2;
export const INSPECT_DISTANCE = 2.25;
export const REPAIR_DISTANCE = 2.1;
export const SQUIRTLE_NOTICE_DISTANCE = 5.4;
export const SQUIRTLE_TALK_DISTANCE = 1.85;
export const FOLLOW_SPEED = 2.05;
export const CAMERA_LOOK_COMPLETE_DELAY = 0.9;
export const NAME_CHAR_LIMIT = 12;

export const OPENING_LINE = "Impact confirmed. I found a living Builder in the ash.";
export const SQUIRTLE_HELP_LINE = "nnng...Wa...water...";

export const NAME_KEYBOARD_ROWS = [
  ["#", "[", "]", "$", "%", "^", "&", "*", "(", ")", "_"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "\""],
  ["Z", "X", "C", "V", "B", "N", "M", "<", ">", "+", "="]
];

const TANGROWTH_NAME = SANDBOTS_BOT_NAMES.overseer;

const HUMAN_CHOICES = [
  { id: "human", label: "Builder" },
  { id: "nope", label: "Not sure" }
];

const POKEDEX_REACTION_CHOICES = [
  { id: "really", label: "Really?" },
  { id: "awww", label: "Awww..." }
];

const POKEDEX_CHOICES = [
  { id: "want-it", label: "I want it!" },
  { id: "junky", label: "It's kinda junky" }
];

const TRAINER_MEMORY_CHOICES = [
  { id: "yep", label: "Maybe" },
  { id: "bingo", label: "Probably" }
];

const NAME_CONFIRM_CHOICES = [
  { id: "betcha", label: "You betcha!" },
  { id: "nope", label: "Uhh, nope..." }
];

const WORLD_QUESTION_CHOICES = [
  { id: "humans", label: "What happened to the humans?" },
  { id: "world", label: "What happened to this world?" }
];

export function getActTwoTutorialFollowTarget(state) {
  if (state.followTargetId === "overlook") {
    return {
      id: "overlook",
      destination: [18.6, 0.02, -12.4],
      title: state.followTargetReached ? "Catch Up" : `Follow ${TANGROWTH_NAME}`,
      eyebrow: "Escort",
      copy: state.followTargetReached
        ? `${TANGROWTH_NAME} stopped ahead. Move closer to keep talking.`
        : `${TANGROWTH_NAME} is heading deeper into the ruins. Keep up.`,
      nextConversation: "overlookInfo"
    };
  }

  if (state.followTargetId === "plant") {
    return {
      id: "plant",
      destination: [
        state.repairPlantPosition[0] - 2.15,
        state.repairPlantPosition[1],
        state.repairPlantPosition[2] - 0.85
      ],
      title: state.followTargetReached ? "Catch Up" : `Follow ${TANGROWTH_NAME}`,
      eyebrow: "Escort",
      copy: state.followTargetReached
        ? `${TANGROWTH_NAME} found the object. Walk up to him.`
        : `${TANGROWTH_NAME} spotted something ahead. Follow him to the object.`,
      nextConversation: "repairIntro"
    };
  }

  return null;
}

export function getActTwoTutorialConversation(conversationId, state) {
  switch (conversationId) {
    case "intro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Impact confirmed. Who is still moving out there?"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "A Builder? Good. I did not want to restore a planet with only anxiety and a clipboard."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Your calibration is strange. Are you operational enough to help?",
          choices: HUMAN_CHOICES,
          responseKey: "humanClaim"
        }
      ];
    case "reveal":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Those quiet servos... that lost look... yes, definitely one of ours."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "You are a Builder, which is more useful than panic and less emotionally complicated."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "That sound is a helper bot distress ping. We should find it before the silence does."
        }
      ];
    case "squirtleDiscovery":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: SQUIRTLE_HELP_LINE
        },
        {
          speaker: TANGROWTH_NAME,
          text: `That is ${SANDBOTS_BOT_NAMES.hydro}. Its tank is nearly dry. Embarrassing, but fixable.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: "If Hydro can move water again, we can restore dry ground and thirsty trees."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "There has to be something we can do before the tank runs dry."
        }
      ];
    case "squirtleHelp":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Rrrgh... Usually I can push water wherever I want..."
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Ahh, if only there were... another helpful Builder around to prime the pump..."
        }
      ];
    case "transformUnlock":
      return [
        {
          speaker: "",
          text: "Hydro Jet is ready."
        },
        {
          speaker: "",
          text: `You learned ${SANDBOTS_ITEM_NAMES.hydroTool}.`
        }
      ];
    case "waterGunPrompt":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: `That was messy, but ${SANDBOTS_BOT_NAMES.hydro}'s water tool is yours now.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: `Try ${SANDBOTS_ITEM_NAMES.hydroTool} near ${SANDBOTS_BOT_NAMES.hydro}.`
        }
      ];
    case "squirtleSaved":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "I'm online. Thank you. I really thought my last log was going to be a leak report."
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "I owe you one..."
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Huh? Something's beeping..."
        }
      ];
    case "afterPokedexIntro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: `Oho! The ${SANDBOTS_WORLD_TERMS.codex} still works after all.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: "It has been an age since I last saw another helper bot moving."
        },
        {
          speaker: TANGROWTH_NAME,
          text: `The ${SANDBOTS_WORLD_TERMS.codex}'s days of being useful may be long gone, but so are mine and here we are.`,
          choices: POKEDEX_REACTION_CHOICES,
          responseKey: "pokedexReaction"
        }
      ];
    case "afterPokedexHope":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "But that was then! Things have changed!"
        },
        {
          speaker: TANGROWTH_NAME,
          text: "I'd come to believe this world was down to one anxious overseer and some decorative dust."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "But today, out of nowhere, I met the two of you. Hope springs anew, which is inconveniently pleasant."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "By the way, where in the world have you two been up until now?"
        }
      ];
    case "squirtlePast":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Hum... I don't really remember too well..."
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "I used to idle beside a clear pond and pretend that counted as work."
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "This time I woke up flat on the ground. Maybe I slept a little too efficiently."
        }
      ];
    case "wastelandReply":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Is that so? Fascinating..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "This whole area is a wasteland. I do not know of any ponds around here."
        }
      ];
    case "groundGreening":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Forget about that, look at this!"
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "See, the ground around here turned green!"
        },
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "I bet it grew because you sprayed water around here! That's so awesome!"
        }
      ];
    case "waterRequest":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Oho... it is true. The ground was parched, and now one patch is alive again."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "That is not a miracle. Better. It is repeatable."
        },
        {
          speaker: TANGROWTH_NAME,
          text: `Use ${SANDBOTS_ITEM_NAMES.hydroTool} on dry ground and plants around here.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: "If the water loop holds, this place can become livable again."
        }
      ];
    case "squirtleAgreement":
      return [
        {
          speaker: SANDBOTS_BOT_NAMES.hydro,
          text: "Yeah, great idea!"
        }
      ];
    case "pokedex":
      return [
        {
          speaker: "",
          text: `You found a ${SANDBOTS_WORLD_TERMS.codex}. It still has a working entry for the bot you just helped.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Oho! That old field device keeps notes on habitats and bot repairs.",
          choices: POKEDEX_CHOICES,
          responseKey: "pokedexChoice"
        }
      ];
    case "trainerMemory":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "You are in better shape than most of our infrastructure."
        },
        {
          speaker: TANGROWTH_NAME,
          text: `And now that you have a ${SANDBOTS_WORLD_TERMS.codex}, you look almost official. Almost.`
        },
        {
          speaker: TANGROWTH_NAME,
          text: "Could you be carrying an old colony operator profile?",
          choices: TRAINER_MEMORY_CHOICES,
          responseKey: "trainerLookChoice"
        }
      ];
    case "trainerMemoryFinale":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Hohoho! I am sure that old operator profile had excellent posture."
        }
      ];
    case "namePrompt":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Do you have a name?"
        }
      ];
    case "nameConfirm":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: `Ahhh, so you were called "${state.responses.playerName || state.playerName || "Builder"}"?`,
          choices: NAME_CONFIRM_CHOICES,
          responseKey: "nameConfirmation"
        }
      ];
    case "worldQuestion":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "It has been a long time since humans could safely live around here.",
          choices: WORLD_QUESTION_CHOICES,
          responseKey: "worldQuestion"
        }
      ];
    case "comeWithMe":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Ohh, you do not know what happened here? Right then. Come with me."
        }
      ];
    case "overlookInfo":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Humans used to live here, but now it's... well, what you see."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "The grass is dead, there is dust all over the place..."
        },
        {
          speaker: TANGROWTH_NAME,
          text: "What is that on the ground over there? A damaged repair unit?",
          cameraFocusTarget: "repairPlant"
        }
      ];
    case "goSee":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "let's go see!"
        }
      ];
    case "repairIntro":
      return [
        {
          speaker: TANGROWTH_NAME,
          text: "Oh, it is a plant tray. It needs repair before this soil can host anything useful."
        }
      ];
    default:
      return [];
  }
}
