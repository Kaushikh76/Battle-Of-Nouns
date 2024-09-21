import { TestingAppChain } from '@proto-kit/sdk';
import {
  Bool,
  CircuitString,
  Field,
  FlexibleProvablePure,
  PrivateKey,
} from 'o1js';
import { UInt64 } from '@proto-kit/library';
import { log } from '@proto-kit/common';
import { Pickles } from 'o1js/dist/node/snarky';
import { RuntimeModule } from '@proto-kit/module';

import { BattleOfNounsLogic } from '../src/games/battle_of_nouns/BattleOfNounsLogic';
// import {
//   PokerDecryptProofPublicInput,
//   PokerDecryptProof,
//   PokerPermutationMatrix,
//   PokerShuffleProof,
//   PokerShuffleProofPublicInput,
//   // initialEnctyptedPokerDeck,
//   pokerInitialEnctyptedDeck,
//   provePokerDecrypt,
//   pokerShuffle,
// } from '../src/engine/cards/base-decks/PokerDeck';
import { dummyBase64Proof } from 'o1js/dist/node/lib/proof-system/zkprogram';

log.setLevel('ERROR');

describe('battle of nouns', () => {
  it('Check if successful game joining', async () => {
    const appChain = TestingAppChain.fromRuntime({
      BattleOfNounsLogic: BattleOfNounsLogic,
    });

    appChain.configurePartial({
      Runtime: {
        BattleOfNounsLogic: {},
        Balances: {},
      },
    });

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const bobPrivateKey = PrivateKey.random();
    const bob = bobPrivateKey.toPublicKey();

    await appChain.start();
    appChain.setSigner(alicePrivateKey);
    const battleOfNouns = appChain.runtime.resolve('BattleOfNounsLogic');

    const gameId = UInt64.from(1);
    appChain.setSigner(alicePrivateKey);

    console.log('Creating Lobby');
    let tx = await appChain.transaction(alice, async () => {
      await battleOfNouns.createLobby(
        CircuitString.fromString('test'),
        UInt64.from(0),
        Bool(false),
        alice,
        Field.from(0),
      );
    });

    await tx.sign();
    await tx.send();

    let block = await appChain.produceBlock();

    expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
    const lobbyId =
      await appChain.query.runtime.BattleOfNounsLogic.currentLobby.get(alice);
    appChain.setSigner(bobPrivateKey);
    if (lobbyId != undefined) {
      console.log('Joining Lobby');
      let tx = await appChain.transaction(bob, async () => {
        await battleOfNouns.joinLobby(lobbyId);
      });
      await tx.sign();
      await tx.send();

      let block = await appChain.produceBlock();

      expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
    }

    // let game = await appChain.query.runtime.BiggerCard.games.get(gameId);
    // console.log(game?.encryptedDeck.cards[0].toCard().toString());
    // console.log(game?.encryptedDeck.cards[1].toCard().toString());
    // expect(game!.id.equals(gameId).toBoolean()).toBeTruthy();
    // expect(game!.firstPlayer.toBase58()).toBe(alice.toBase58());

    // appChain.setSigner(bobPrivateKey);
    // tx = await appChain.transaction(bob, async () => {
    //   await biggerCard.participate(gameId);
    // });

    // await tx.sign();
    // await tx.send();

    // block = await appChain.produceBlock();
    // expect(block?.transactions[0].status.toBoolean()).toBeTruthy();

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // expect(game?.secondPlayer.toBase58()).toBe(bob.toBase58());

    // expect(game?.status.equals(GameStatuses.INIT)).toBeTruthy();

    // await sendShuffle(
    //   appChain,
    //   biggerCard,
    //   game!,
    //   PokerPermutationMatrix.getZeroMatrix().swap(0, 51) as any, // !
    //   alicePrivateKey,
    // );

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // console.log(game?.encryptedDeck.cards[0].value[0].x.toString());
    // console.log(game?.encryptedDeck.cards[0].value[1].x.toString());
    // console.log(game?.encryptedDeck.cards[0].value[2].x.toString());

    // await sendShuffle(
    //   appChain,
    //   biggerCard,
    //   game!,
    //   PokerPermutationMatrix.getZeroMatrix() as any, // !
    //   bobPrivateKey,
    // );

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // await openCards(appChain, biggerCard, game!, alicePrivateKey);

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // await openCards(appChain, biggerCard, game!, bobPrivateKey);

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // console.log(game?.encryptedDeck.cards[0].toCard().toString());
    // console.log(game?.encryptedDeck.cards[1].toCard().toString());

    // appChain.setSigner(alicePrivateKey);
    // tx = await appChain.transaction(alice, async () => {
    //   await biggerCard.pickWinner(gameId);
    // });

    // await tx.sign();
    // await tx.send();

    // block = await appChain.produceBlock();
    // expect(block!.transactions[0].status.toBoolean()).toBeTruthy();

    // game = await appChain.query.runtime.BiggerCard.games.get(gameId);

    // expect(game!.winner.equals(alice).toBoolean()).toBeTruthy();
  }, 100000);
});
