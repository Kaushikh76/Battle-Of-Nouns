import { state, runtimeMethod, runtimeModule } from '@proto-kit/module';
import { State, StateMap, assert } from '@proto-kit/protocol';
import {
  PublicKey,
  Struct,
  UInt64,
  Provable,
  Bool,
  UInt32,
  Field,
  Int64,
} from 'o1js';
import { MatchMaker } from '../engine/MatchMaker';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';
import { Lobby } from '../engine/LobbyManager';
import { RandomGenerator } from '../engine/Random';
import {
  BOARD_SIZE,
  BUILD_COST,
  CharacterType,
  EMPTY_HOUSES,
  FLOWERS,
  INITIAL_NOUNS,
  MAX_CHARACTERS,
  PLAYERS_COUNT,
  SUMMON_COST,
  TileType,
  TREES,
  WIN_CONDITION_NOUNS,
} from './constants';

class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  toFields(): Field[] {
    return [...this.x.toFields(), ...this.y.toFields()];
  }
  equals(x: UInt32, y: UInt32): Bool {
    return this.x.equals(x).and(this.y.equals(y));
  }
  create(x: UInt32, y: UInt32): Position {
    return new Position({ x, y });
  }
}

class Character extends Struct({
  type: UInt32,
  hp: UInt32,
  damage: UInt32,
  position: Position,
  owner: PublicKey,
  lastAttackMoveBlockHeight: UInt64,
  lastMoveBlockHeight: UInt64,
}) {
  toFields(): Field[] {
    return [
      ...this.type.toFields(), // Convert type to fields
      ...this.hp.toFields(), // Convert hp to fields
      ...this.damage.toFields(), // Convert damage to fields
      ...this.position.toFields(), // Assuming position is a provable type
      ...this.owner.toFields(), // Convert owner (PublicKey) to fields
    ];
  }
  static create(
    type: UInt32,
    position: Position,
    owner: PublicKey,
    moveBlockHeight: UInt64,
  ): Character {
    let hp = Provable.if(
      type.equals(UInt32.from(CharacterType.Warrior)),
      Provable.if(
        type.equals(UInt32.from(CharacterType.Defender)),
        UInt32.from(20),
        UInt32.from(3),
      ),
      UInt32.from(12),
    );
    let damage = Provable.if(
      type.equals(UInt32.from(CharacterType.Warrior)),
      Provable.if(
        type.equals(UInt32.from(CharacterType.Defender)),
        UInt32.from(3),
        UInt32.from(10),
      ),
      UInt32.from(6),
    );

    return new Character({
      type: UInt32.from(type),
      hp: hp,
      damage: damage,
      position: position,
      lastAttackMoveBlockHeight: moveBlockHeight,
      lastMoveBlockHeight: moveBlockHeight,
      owner: owner,
    });
  }
}

class Tile extends Struct({
  type: UInt32,
  owner: PublicKey,
}) {
  toFields(): Field[] {
    return [
      ...this.type.toFields(), // Convert type to fields
      ...this.owner.toFields(), // Convert owner (PublicKey) to fields
    ];
  }
}

class GameField extends Struct({
  tiles: Provable.Array(Provable.Array(Tile, BOARD_SIZE), BOARD_SIZE),
  characters: Provable.Array(Character, MAX_CHARACTERS), // Increased max characters
}) {
  getCharacter(index: UInt32): Character {
    return Provable.switch(
      this.characters.map((_, i) => index.equals(UInt32.from(i))),
      Character,
      this.characters,
    );
  }

  getTile(position: Position): Tile {
    return Provable.switch(
      this.tiles.map((row, i) =>
        row.reduce(
          (acc, tile, j) =>
            acc.or(position.equals(UInt32.from(i), UInt32.from(j))),
          Bool(false),
        ),
      ),
      Tile,
      this.tiles.map((row, i) =>
        Provable.switch(
          row.map((tile, j) => position.equals(UInt32.from(i), UInt32.from(j))),
          Tile,
          row,
        ),
      ),
    );
  }
}
class PlayerInfo extends Struct({
  publicKey: PublicKey,
  nouns: UInt32,
  nounsPerTurn: UInt32,
  houseCount: UInt32,
}) {
  toFields(): Field[] {
    return [
      ...this.publicKey.toFields(),
      ...this.nouns.toFields(),
      ...this.nounsPerTurn.toFields(),
      ...this.houseCount.toFields(),
    ];
  }
  spendBuildStructure(): PlayerInfo {
    assert(
      this.nouns.greaterThanOrEqual(UInt32.from(BUILD_COST)),
      'Not enough NOUNS',
    );

    return new PlayerInfo({
      publicKey: this.publicKey,
      nouns: this.nouns.sub(UInt32.from(BUILD_COST)),
      nounsPerTurn: this.nounsPerTurn.add(UInt32.from(1)),
      houseCount: this.houseCount,
    });
  }
  spendNouns(amount: UInt32): PlayerInfo {
    assert(this.nouns.greaterThanOrEqual(amount), 'Not enough NOUNS');

    return new PlayerInfo({
      publicKey: this.publicKey,
      nouns: this.nouns.sub(amount),
      nounsPerTurn: this.nounsPerTurn,
      houseCount: this.houseCount,
    });
  }
}

class GameInfo extends Struct({
  players: Provable.Array(PlayerInfo, PLAYERS_COUNT),
  currentMoveUser: PublicKey,
  lastMoveBlockHeight: UInt64,
  field: GameField,
  winner: PublicKey,
}) {
  getPlayer(publicKey: PublicKey): PlayerInfo {
    return Provable.switch(
      this.players.map((player) => player.publicKey.equals(publicKey)),
      PlayerInfo,
      this.players,
    );
  }
}

@runtimeModule()
export class BattleOfNounsLogic extends MatchMaker {
  @state() public games = StateMap.from<UInt64, GameInfo>(UInt64, GameInfo);
  @state() public gamesNum = State.from<UInt64>(UInt64);

  public override async initGame(
    lobby: Lobby,
    shouldUpdate: Bool,
  ): Promise<UInt64> {
    const currentGameId = lobby.id;

    await this.games.set(
      Provable.if(shouldUpdate, currentGameId, UInt64.from(0)),
      new GameInfo({
        players: lobby.players.map(
          (player) =>
            new PlayerInfo({
              publicKey: player,
              nouns: UInt32.from(INITIAL_NOUNS),
              nounsPerTurn: UInt32.from(2),
              houseCount: UInt32.from(1),
            }),
        ),
        currentMoveUser: lobby.players[0],
        lastMoveBlockHeight: this.network.block.height,
        field: new GameField({
          tiles: Array(BOARD_SIZE).map(() =>
            Array(BOARD_SIZE).map(
              () =>
                new Tile({ type: UInt32.from(0), owner: PublicKey.empty() }),
            ),
          ),
          characters: Array(MAX_CHARACTERS).map(
            () =>
              new Character({
                type: UInt32.from(0),
                hp: UInt32.from(0),
                damage: UInt32.from(0),
                position: new Position({
                  x: UInt32.from(0),
                  y: UInt32.from(0),
                }),
                owner: PublicKey.empty(),
                lastAttackMoveBlockHeight: UInt64.from(0),
                lastMoveBlockHeight: UInt64.from(0),
              }),
          ),
        }),
        winner: PublicKey.empty(),
      }),
    );

    await this.gameFund.set(
      currentGameId,
      ProtoUInt64.from(lobby.participationFee).mul(PLAYERS_COUNT),
    );

    return await super.initGame(lobby, shouldUpdate);
  }

  private createInitialField(
    players: PublicKey[],
    randomGenerator: RandomGenerator,
  ): GameField {
    const INITIAL_POSITIONS = [
      new Position({ x: UInt32.from(0), y: UInt32.from(0) }),
      new Position({ x: UInt32.from(0), y: UInt32.from(BOARD_SIZE - 1) }),
      new Position({
        x: UInt32.from(BOARD_SIZE - 1),
        y: UInt32.from(BOARD_SIZE - 1),
      }),
    ];

    const tilesToPlace = [
      { type: TileType.EmptyHouse, count: EMPTY_HOUSES },
      { type: TileType.Flower, count: FLOWERS },
      { type: TileType.Tree, count: TREES },
    ];

    let remainingTiles = UInt32.from(EMPTY_HOUSES + FLOWERS + TREES);
    const characters = INITIAL_POSITIONS.map((pos, index) => {
      const characterType = Number(randomGenerator.getNumber(3).magnitude) + 1;
      return Character.create(
        UInt32.from(Number(characterType)),
        pos,
        players[index],
        this.network.block.height,
      );
    });
    const field = Array(BOARD_SIZE).map((_, i) =>
      Array(BOARD_SIZE).map((_, j) => {
        const position = new Position({ x: UInt32.from(i), y: UInt32.from(j) });

        // Check if it's an initial position
        const isInitialPosition = INITIAL_POSITIONS.reduce(
          (acc, pos, index) =>
            acc.or(pos.x.equals(position.x).and(pos.y.equals(position.y))),
          Bool(false),
        );

        const initialPositionIndex = INITIAL_POSITIONS.reduce(
          (acc, pos, index) =>
            Provable.if(
              pos.x.equals(position.x).and(pos.y.equals(position.y)),
              UInt32.from(index),
              acc,
            ),
          UInt32.from(PLAYERS_COUNT),
        );

        // Place captured houses for players
        const capturedHouse = new Tile({
          type: UInt32.from(TileType.CapturedHouse),
          owner: Provable.switch(
            players.map((_, idx) =>
              initialPositionIndex.equals(UInt32.from(idx)),
            ),
            PublicKey,
            players,
          ),
        });

        // Randomly place other tiles or leave as grass
        const randomValue = Number(
          randomGenerator.getNumber(BOARD_SIZE * BOARD_SIZE).magnitude,
        );
        const shouldPlaceSpecialTile = UInt32.from(randomValue)
          .lessThan(remainingTiles)
          .and(isInitialPosition.not());

        const specialTileType = Provable.switch(
          tilesToPlace.map((tile, index) =>
            UInt32.from(randomValue)
              .mod(UInt32.from(tilesToPlace.length))
              .equals(UInt32.from(index))
              .and(UInt32.from(tile.count).greaterThan(UInt32.from(0))),
          ),
          UInt32,
          tilesToPlace.map((tile) => UInt32.from(tile.type)),
        );

        const specialTile = new Tile({
          type: specialTileType,
          owner: PublicKey.empty(),
        });

        remainingTiles = Provable.if(
          shouldPlaceSpecialTile,
          remainingTiles.sub(1),
          remainingTiles,
        );

        return Provable.if(
          isInitialPosition,
          capturedHouse,
          Provable.if(
            shouldPlaceSpecialTile,
            specialTile,
            new Tile({
              type: UInt32.from(TileType.Grass),
              owner: PublicKey.empty(),
            }),
          ),
        );
      }),
    );

    return new GameField({
      tiles: field,
      characters: characters,
    });
  }

  // private placeRandomTiles(
  //   field: Tile[][],
  //   randomGenerator: RandomGenerator,
  //   tileType: TileType,
  //   count: number,
  // ): Tile[][] {
  //   let newField = field.map((row) => [...row]);
  //   let placed = 0;
  //   while (placed < count) {
  //     const x = Number(randomGenerator.getNumber(BOARD_SIZE).magnitude);
  //     const y = Number(randomGenerator.getNumber(BOARD_SIZE).magnitude);
  //     if (newField[x][y].type.equals(UInt32.from(TileType.Grass))) {
  //       newField[x][y] = new Tile({
  //         type: UInt32.from(tileType),
  //         owner: PublicKey.empty(),
  //       });
  //       placed++;
  //     }
  //   }
  //   return newField;
  // }

  // TODO: Implement timeout
  // @runtimeMethod()
  // public async proveOpponentTimeout(gameId: UInt64): Promise<void> {
  //   await super.proveOpponentTimeout(gameId, true);
  // }

  @runtimeMethod()
  public async performAction(
    gameId: UInt64,
    actionType: UInt32, // 0: move, 1: attack, 2: capture, 3: build, 4: summon
    characterIndex: UInt32,
    targetPosition: Position,
  ): Promise<void> {
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    assert(game.value.currentMoveUser.equals(sender), `Not your move`);
    assert(game.value.winner.equals(PublicKey.empty()), `Game finished`);

    game.value = Provable.switch(
      [
        actionType.equals(UInt32.from(0)),
        // actionType.equals(UInt32.from(1)),
        // actionType.equals(UInt32.from(2)),
        // actionType.equals(UInt32.from(3)),
        // actionType.equals(UInt32.from(4)),
        // actionType.equals(UInt32.from(5)),
      ],
      GameInfo,
      [
        this.moveCharacter(game.value, characterIndex, targetPosition),
        // this.attackCharacter(game.value, characterIndex, targetPosition),
        // this.captureHouse(game.value, characterIndex),
        // this.buildStructure(game.value, characterIndex),
        // this.captureStructure(game.value, characterIndex),
        // this.summonCharacter(game.value, targetPosition),
      ],
      { allowNonExclusive: false },
    );

    game.value = await this.checkEndGame(gameId, game.value);
    await this.games.set(gameId, game.value);
  }

  private moveCharacter(
    game: GameInfo,
    characterIndex: UInt32,
    newPosition: Position,
  ): GameInfo {
    const character = game.field.getCharacter(characterIndex);
    assert(character.owner.equals(game.currentMoveUser), 'Not your character');
    assert(
      character.lastMoveBlockHeight.equals(game.lastMoveBlockHeight).not(),
      'Character already moved',
    );
    assert(
      this.isAdjacentPosition(character.position, newPosition),
      'Invalid move',
    );

    const updatedCharacters = game.field.characters.map((char, index) =>
      Provable.if(
        UInt32.from(index).equals(characterIndex),
        new Character({ ...char, position: newPosition }),
        char,
      ),
    );

    return new GameInfo({
      ...game,
      field: new GameField({ ...game.field, characters: updatedCharacters }),
    });
  }

  // private attackCharacter(
  //   game: GameInfo,
  //   attackerIndex: UInt32,
  //   targetPosition: Position,
  // ): GameInfo {
  //   const attacker = game.field.getCharacter(attackerIndex);
  //   assert(attacker.owner.equals(game.currentMoveUser), 'Not your character');
  //   assert(
  //     attacker.lastAttackMoveBlockHeight.equals(game.lastMoveBlockHeight).not(),
  //     'Character already attacked',
  //   );
  //   assert(
  //     this.isAdjacentPosition(attacker.position, targetPosition),
  //     'Target is not adjacent',
  //   );

  //   const updatedCharacters = game.field.characters.map((char, index) => {
  //     const isTarget = char.position.equals(targetPosition.x, targetPosition.y);
  //     const isAttacker = UInt32.from(index).equals(attackerIndex);

  //     const targetHP = Provable.if(
  //       isTarget,
  //       char.hp.sub(attacker.damage),
  //       char.hp,
  //     );
  //     const attackerHP = Provable.if(
  //       isTarget.and(targetHP.greaterThan(UInt32.from(0))),
  //       attacker.hp.sub(char.damage),
  //       attacker.hp,
  //     );

  //     return Provable.if(
  //       isTarget.or(isAttacker),
  //       new Character({
  //         ...char,
  //         hp: Provable.if(isTarget, targetHP, attackerHP),
  //         position: Provable.if(
  //           isTarget.and(targetHP.equals(UInt32.from(0))),
  //           attacker.position,
  //           char.position,
  //         ),
  //         lastAttackMoveBlockHeight: Provable.if(
  //           isAttacker,
  //           game.lastMoveBlockHeight,
  //           char.lastAttackMoveBlockHeight,
  //         ),
  //       }),
  //       char,
  //     );
  //   });

  //   return new GameInfo({
  //     ...game,
  //     field: new GameField({ ...game.field, characters: updatedCharacters }),
  //   });
  // }

  // private captureHouse(game: GameInfo, characterIndex: UInt32): GameInfo {
  //   const character = game.field.getCharacter(characterIndex);
  //   assert(character.owner.equals(game.currentMoveUser), 'Not your character');
  //   assert(
  //     character.lastMoveBlockHeight.equals(game.lastMoveBlockHeight).not(),
  //     'Cannot move and capture in the same turn',
  //   );

  //   const tile = game.field.getTile(character.position);
  //   assert(
  //     tile.type
  //       .equals(UInt32.from(TileType.EmptyHouse))
  //       .or(tile.type.equals(UInt32.from(TileType.CapturedHouse))),
  //     'Not positioned on top of a house',
  //   );
  //   assert(tile.owner.equals(game.currentMoveUser).not(), 'Already your house');

  //   const previousOwner = Provable.if(
  //     tile.type.equals(UInt32.from(TileType.CapturedHouse)),
  //     tile.owner,
  //     PublicKey.empty(),
  //   );

  //   const updatedTiles = game.field.tiles.map((row, i) =>
  //     row.map((t, j) =>
  //       Provable.if(
  //         character.position.equals(UInt32.from(i), UInt32.from(j)),
  //         new Tile({
  //           type: UInt32.from(TileType.CapturedHouse),
  //           owner: game.currentMoveUser,
  //         }),
  //         t,
  //       ),
  //     ),
  //   );

  //   const [updatedNounsPerTurn, updatedHouseCount] = game.players.reduce<
  //     [UInt32[], UInt32[]]
  //   >(
  //     (acc, player, index) => {
  //       const isCurrentMoveUser = player.equals(game.currentMoveUser);
  //       const isPreviousOwner = player.equals(previousOwner);

  //       acc[0].push(
  //         Provable.if(
  //           isCurrentMoveUser,
  //           game.nounsPerTurn[index].add(2),
  //           Provable.if(
  //             isPreviousOwner,
  //             game.nounsPerTurn[index].sub(2),
  //             game.nounsPerTurn[index],
  //           ),
  //         ),
  //       );
  //       acc[1].push(
  //         Provable.if(
  //           isCurrentMoveUser,
  //           game.houseCount[index].add(1),
  //           Provable.if(
  //             isPreviousOwner,
  //             game.houseCount[index].sub(1),
  //             game.houseCount[index],
  //           ),
  //         ),
  //       );

  //       return acc;
  //     },
  //     [[], []],
  //   );

  //   return new GameInfo({
  //     ...game,
  //     field: new GameField({ ...game.field, tiles: updatedTiles }),
  //     nounsPerTurn: updatedNounsPerTurn,
  //     houseCount: updatedHouseCount,
  //   });
  // }

  // private buildStructure(game: GameInfo, characterIndex: UInt32): GameInfo {
  //   const character = game.field.getCharacter(characterIndex);
  //   assert(character.owner.equals(game.currentMoveUser), 'Not your character');
  //   assert(
  //     character.lastMoveBlockHeight.equals(game.lastMoveBlockHeight).not(),
  //     'Cannot move and build in the same turn',
  //   );

  //   const tile = game.field.getTile(character.position);

  //   assert(
  //     tile.type
  //       .equals(UInt32.from(TileType.Flower))
  //       .or(tile.type.equals(UInt32.from(TileType.Tree))),
  //     'Already constructed',
  //   );
  //   assert(
  //     tile.owner.equals(game.currentMoveUser).not(),
  //     'Already your structure',
  //   );

  //   const updatedTiles = game.field.tiles.map((row, i) =>
  //     row.map((t, j) =>
  //       Provable.if(
  //         character.position.equals(UInt32.from(i), UInt32.from(j)),
  //         new Tile({
  //           type: Provable.if(
  //             t.type.equals(UInt32.from(TileType.Flower)),
  //             UInt32.from(TileType.Garden),
  //             UInt32.from(TileType.Sawmill),
  //           ),
  //           owner: game.currentMoveUser,
  //         }),
  //         t,
  //       ),
  //     ),
  //   );
  //   const updatedPlayers = game.players.map((player, index) =>
  //     Provable.if(
  //       player.publicKey.equals(game.currentMoveUser),
  //       player.spendBuildStructure(),
  //       player,
  //     ),
  //   );

  //   return new GameInfo({
  //     ...game,
  //     field: new GameField({ ...game.field, tiles: updatedTiles }),
  //     players: updatedPlayers,
  //   });
  // }

  // private captureStructure(game: GameInfo, characterIndex: UInt32): GameInfo {
  //   const character = game.field.getCharacter(characterIndex);
  //   assert(character.owner.equals(game.currentMoveUser), 'Not your character');
  //   assert(
  //     character.lastMoveBlockHeight.equals(game.lastMoveBlockHeight).not(),
  //     'Cannot move and capture in the same turn',
  //   );
  //   let previousOwner = PublicKey.empty();
  //   const updatedTiles: Tile[][] = game.field.tiles.map((tileRow, i) => {
  //     return tileRow.map((tile, j) => {
  //       const isPosition = character.position.equals(
  //         UInt32.from(i),
  //         UInt32.from(j),
  //       );

  //       assert(
  //         Bool.or(
  //           isPosition.not(),
  //           Bool.or(
  //             tile.type.equals(UInt32.from(TileType.Flower)),
  //             tile.type.equals(UInt32.from(TileType.Tree)),
  //           ),
  //         ),
  //         'Not positioned on top of a resource',
  //       );

  //       assert(
  //         Bool.or(
  //           isPosition.not(),
  //           tile.owner.equals(game.currentMoveUser).not(),
  //         ),
  //         'Already your resource',
  //       );
  //       previousOwner = Provable.if(
  //         Bool.or(
  //           tile.type.equals(UInt32.from(TileType.Sawmill)),
  //           tile.type.equals(UInt32.from(TileType.Garden)),
  //         ),
  //         tile.owner,
  //         PublicKey.empty(),
  //       );
  //       return Provable.if(
  //         isPosition,
  //         new Tile({
  //           type: Provable.if(
  //             tile.type.equals(UInt32.from(TileType.Flower)),
  //             UInt32.from(TileType.Garden),
  //             UInt32.from(TileType.Sawmill),
  //           ),
  //           owner: game.currentMoveUser,
  //         }),
  //         tile,
  //       );
  //     });
  //   });
  // Updating nounsPerTurn: +1 for the currentMoveUser, -1 for the previous owner
  // const updatedNounsPerTurn = game.players.map((player, index) => {
  //   return Provable.if(
  //     player.equals(game.currentMoveUser),
  //     game.nounsPerTurn[index].add(1), // +1 for the attacker
  //     Provable.if(
  //       player.equals(previousOwner),
  //       game.nounsPerTurn[index].sub(1), // -1 for the previous owner
  //       game.nounsPerTurn[index],
  //     ),
  //   );
  // });
  //   return new GameInfo({
  //     ...game,
  //     field: new GameField({
  //       ...game.field,
  //       tiles: updatedTiles,
  //     }),
  //     // nounsPerTurn: updatedNounsPerTurn,
  //   });
  // }

  // private summonCharacter(game: GameInfo, position: Position): GameInfo {
  //   const currentPlayer = game.getPlayer(game.currentMoveUser);
  //   const updatedPlayer = currentPlayer.spendNouns(UInt32.from(SUMMON_COST));

  //   // Check if the tile is a captured house owned by the current player
  //   const tile = game.field.getTile(position);
  //   assert(
  //     tile.type.equals(UInt32.from(TileType.CapturedHouse)),
  //     'Not a captured house',
  //   );
  //   assert(tile.owner.equals(game.currentMoveUser), 'Not your house');

  //   // Generate a random character type
  //   const randomGenerator = RandomGenerator.from(Field.random());
  //   const characterType = Number(randomGenerator.getNumber(3).magnitude) + 1;

  //   // Create the new character
  //   const newCharacter = Character.create(
  //     characterType,
  //     position,
  //     game.currentMoveUser,
  //     game.lastMoveBlockHeight,
  //   );

  //   // Find an empty slot for the new character
  //   let characterAdded = Bool(false);
  //   const updatedCharacters = game.field.characters.map((char) => {
  //     const isEmpty = char.type.equals(UInt32.from(0));
  //     const shouldAdd = characterAdded.not().and(isEmpty);
  //     characterAdded = Provable.if(shouldAdd, Bool(true), characterAdded);

  //     // Ensure no other character is at the same position
  //     assert(
  //       char.position.equals(position.x, position.y).not().or(isEmpty),
  //       'Position already occupied',
  //     );

  //     return Provable.if(shouldAdd, newCharacter, char);
  //   });

  //   // Ensure a character was added
  //   assert(characterAdded, 'No empty slot for new character');

  //   const updatedPlayers = game.players.map((player) =>
  //     Provable.if(
  //       player.publicKey.equals(game.currentMoveUser),
  //       updatedPlayer,
  //       player,
  //     ),
  //   );

  //   return new GameInfo({
  //     ...game,
  //     players: updatedPlayers,
  //     field: new GameField({ ...game.field, characters: updatedCharacters }),
  //   });
  // }

  @runtimeMethod()
  public async endTurn(gameId: UInt64): Promise<void> {
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    assert(game.value.currentMoveUser.equals(sender), `Not your move`);
    assert(game.value.winner.equals(PublicKey.empty()), `Game finished`);

    await this.games.set(gameId, this.nextTurn(game.value));
  }

  private nextTurn(game: GameInfo): GameInfo {
    // Loop over the next PLAYERS_COUNT players to find the next live player
    const nextPlayerAliveStatus = game.players.map((player, index) =>
      player.houseCount.greaterThan(UInt32.from(0)),
    );

    // Find the next player's index who is alive
    const nextPlayerIndex = Provable.switch(
      nextPlayerAliveStatus,
      UInt32,
      game.players.map((_, index) => UInt32.from(index)),
      { allowNonExclusive: false },
    );

    // Find the next player’s public key (for currentMoveUser)
    const changedCurrentMoveUser = Provable.switch(
      nextPlayerAliveStatus,
      PublicKey,
      game.players.map((player) => player.publicKey),
      { allowNonExclusive: false },
    );

    // Update the players' nouns based on the next player’s index
    const updatedPlayers = game.players.map((player, index) =>
      Provable.if(
        nextPlayerIndex.equals(UInt32.from(index)),
        new PlayerInfo({
          ...player,
          nouns: player.nouns.add(player.nounsPerTurn),
        }),
        player,
      ),
    );

    // Return the updated game state
    return new GameInfo({
      ...game,
      players: updatedPlayers,
      currentMoveUser: changedCurrentMoveUser,
    });
  }

  private async checkEndGame(
    gameId: UInt64,
    game: GameInfo,
  ): Promise<GameInfo> {
    let winner: PublicKey = PublicKey.empty();

    for (let i = 0; i < PLAYERS_COUNT; i++) {
      const player = game.players[i];
      const nextIndex = (i + 1) % PLAYERS_COUNT;
      const nextNextIndex = (i + 2) % PLAYERS_COUNT;

      const winByNouns = game.players[i].nouns.greaterThanOrEqual(
        UInt32.from(WIN_CONDITION_NOUNS),
      );
      const winByElimination = game.players[nextIndex].houseCount
        .equals(UInt32.from(0))
        .and(game.players[nextNextIndex].houseCount.equals(UInt32.from(0)));

      const winCondition = winByNouns.or(winByElimination);

      winner = Provable.if(
        winCondition.and(winner.equals(PublicKey.empty())),
        player.publicKey,
        winner,
      );
    }

    const gameEnded = winner.equals(PublicKey.empty()).not();

    // Update the game with the winner (if found)
    const updatedGame = new GameInfo({
      ...game,
      winner: winner,
    });

    // Handle the async endGame logic outside of the Provable computation
    if (gameEnded) {
      await this.endGame(gameId, updatedGame); // Call async endGame if the game has ended
    }

    return updatedGame;
  }

  private async endGame(gameId: UInt64, game: GameInfo): Promise<void> {
    const winnerShare = ProtoUInt64.from(
      Provable.if<ProtoUInt64>(
        game.winner.isEmpty().not(),
        ProtoUInt64,
        ProtoUInt64.from(1),
        ProtoUInt64.from(0),
      ),
    );
    await this.acquireFunds(
      gameId,
      game.winner,
      PublicKey.empty(),
      PublicKey.empty(),
      winnerShare,
      ProtoUInt64.from(1),
      ProtoUInt64.from(0),
      ProtoUInt64.from(1),
    );

    // Clear game state
    await this.activeGameId.set(
      Provable.if(
        game.winner.isEmpty().not(),
        game.players[0].publicKey,
        PublicKey.empty(),
      ),
      UInt64.from(0),
    );
    await this.activeGameId.set(
      Provable.if(
        game.winner.isEmpty().not(),
        game.players[1].publicKey,
        PublicKey.empty(),
      ),
      UInt64.from(0),
    );
    await this.activeGameId.set(
      Provable.if(
        game.winner.isEmpty().not(),
        game.players[2].publicKey,
        PublicKey.empty(),
      ),
      UInt64.from(0),
    );
    await this._onLobbyEnd(gameId, game.winner.isEmpty().not());
  }

  private isAdjacentPosition(pos1: Position, pos2: Position): Bool {
    // Use Provable.if to handle the conditional difference calculation
    const xDiff = Provable.if(
      pos1.x.greaterThanOrEqual(pos2.x),
      pos1.x.sub(pos2.x),
      pos2.x.sub(pos1.x),
    );

    const yDiff = Provable.if(
      pos1.y.greaterThanOrEqual(pos2.y),
      pos1.y.sub(pos2.y),
      pos2.y.sub(pos1.y),
    );

    // Check if the positions are adjacent
    return xDiff
      .lessThanOrEqual(UInt32.from(1)) // x difference <= 1
      .and(yDiff.lessThanOrEqual(UInt32.from(1))) // y difference <= 1
      .and(xDiff.add(yDiff).greaterThan(UInt32.from(0))); // Total difference > 0
  }
}
