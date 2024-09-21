import { createConfig } from "@zknoid/sdk/lib/createConfig";
import { numberGuessingConfig } from "./number_guessing/config";
import { randzuConfig } from "./randzu/config";
import { arkanoidConfig } from "./arkanoid/config";
import { checkersConfig } from "./checkers/config";
import { tileVilleConfig } from "./tileville/config";
import { pokerConfig } from "./poker/config";
import { thimblerigConfig } from "./thimblerig/config";
import { gameTemplateConfig } from "./game-template/config";
import { battleOfNounsConifg } from "./battle_of_nouns/config";

export const zkNoidConfig = createConfig({
  games: [
    tileVilleConfig,
    randzuConfig,
    checkersConfig,
    thimblerigConfig,
    pokerConfig,
    arkanoidConfig,
    numberGuessingConfig,
    battleOfNounsConifg,
  ],
});
