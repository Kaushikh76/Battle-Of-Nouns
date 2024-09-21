const BOARD_SIZE = 15;
const PLAYERS_COUNT = 2;
const SUMMON_COST = 3;
const BUILD_COST = 3;
const INITIAL_NOUNS = 2;
const WIN_CONDITION_NOUNS = 60;
const EMPTY_HOUSES = 10;
const FLOWERS = 15;
const TREES = 15;
const MAX_CHARACTERS = 256;

enum TileType {
  Grass,
  EmptyHouse,
  CapturedHouse,
  Flower,
  Garden,
  Tree,
  Sawmill,
}
enum CharacterType {
  Null,
  Warrior,
  Bomber,
  Defender,
}

export {
  BOARD_SIZE,
  PLAYERS_COUNT,
  SUMMON_COST,
  BUILD_COST,
  INITIAL_NOUNS,
  WIN_CONDITION_NOUNS,
  EMPTY_HOUSES,
  FLOWERS,
  TREES,
  MAX_CHARACTERS,
  TileType,
  CharacterType,
};
