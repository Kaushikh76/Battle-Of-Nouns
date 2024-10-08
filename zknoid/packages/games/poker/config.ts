import { createZkNoidGameConfig } from "@zknoid/sdk/lib/createConfig";
import { Poker } from "./Poker";
import {
  ZkNoidGameFeature,
  ZkNoidGameGenre,
} from "@zknoid/sdk/lib/platform/game_tags";
import { ZkNoidGameType } from "@zknoid/sdk/lib/platform/game_types";

export const pokerConfig = createZkNoidGameConfig({
  id: "poker",
  type: ZkNoidGameType.PVP,
  name: "Poker game",
  author: "ZkNoid team",
  description:
    "Poker is comparing card game in which players wager over which hand is best according to that specific game's rules.",
  image: "/image/games/soon.svg",
  genre: ZkNoidGameGenre.BoardGames,
  features: [ZkNoidGameFeature.Multiplayer],
  isReleased: false,
  releaseDate: new Date(2024, 0, 1),
  popularity: 0,
  rules: "Poker rules",
  runtimeModules: {}, // TEMPORARY!!!
  page: Poker,
  externalUrl: "https://proto.zknoid.io/games/poker/global",
});
