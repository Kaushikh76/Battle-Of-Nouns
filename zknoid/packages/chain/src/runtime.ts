import { UInt64 } from '@proto-kit/library';
import { Balances } from './framework';
import { ModulesConfig } from '@proto-kit/common';
import { BattleOfNounsLogic } from './battle_of_nouns';

const modules = {
  Balances,
  BattleOfNounsLogic,
};

const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: UInt64.from(10000),
  },
  BattleOfNounsLogic: {},
};

export default {
  modules,
  config,
};
