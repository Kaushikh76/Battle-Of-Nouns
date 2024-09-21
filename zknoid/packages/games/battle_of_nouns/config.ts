import { createZkNoidGameConfig } from "@zknoid/sdk/lib/createConfig";
import { ZkNoidGameType } from "@zknoid/sdk/lib/platform/game_types";
import { BattleOfNounsLogic } from "zknoid-chain-dev";
import BattleOfNouns from "./BattleOfNouns";
import {
  ZkNoidGameFeature,
  ZkNoidGameGenre,
} from "@zknoid/sdk/lib/platform/game_tags";
import BattleOfNounsLobby from "./components/BattleOfNounsLobby";
// import BattleOfNounsLobby from '@/games/battle_of_nouns/components/BattleOfNounsLobby';

export const battleOfNounsConifg = createZkNoidGameConfig({
  id: "battle_of_nouns",
  type: ZkNoidGameType.PVP,
  name: "Battle Of Nouns",
  description: "Battle of Nouns is a strategy based 3 player multiplayer game.",
  image: "/image/games/battle_of_nouns.svg",
  genre: ZkNoidGameGenre.BoardGames,
  features: [ZkNoidGameFeature.Multiplayer],
  isReleased: true,
  releaseDate: new Date(2024, 8, 22),
  popularity: 0,
  author: "Kaushik Balachandar",
  rules: "",
  runtimeModules: {
    BattleOfNounsLogic,
  },
  page: BattleOfNouns,
  lobby: BattleOfNounsLobby,
  // externalUrl: 'https://www.tileville.xyz/',
});
