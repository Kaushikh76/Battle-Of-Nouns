import {
  Field,
  Gadgets,
  Int64,
  Poseidon,
  Provable,
  Sign,
  Struct,
  UInt32,
  UInt64,
  UInt8,
} from 'o1js';

const shift64divisor = `0b` + `1${'0'.repeat(64)}`;

// TODO: Optimize
// Now only 64 fits of 256 bits of field used. So can be 4x optimized
// Think how to use Sponge here
export class RandomGenerator extends Struct({
  seed: Field,
  source: Field,
  curValue: Field,
}) {
  static from(seed: Field): RandomGenerator {
    const source = Poseidon.hash([seed]);

    return new RandomGenerator({
      seed,
      source,
      curValue: source,
    });
  }

  getNumber(maxValue: number): Int64 {
    this.source = Poseidon.hash([this.source]);
    this.curValue = this.source;
    let result: Int64 = Int64.from(0);

    let bytes = this.curValue.toBits();

    result.magnitude.value = Field.fromBits(bytes.slice(0 * 32 + 1, 1 * 32));
    result = result.modV2(maxValue);
    result.sgn.value = Field.fromBits(bytes.slice(0, 1 * 32 + 1));

    return result;
  }

  getArknoidNumbers(range: number[]): [Int64, Int64, Int64, Int64] {
    this.source = Poseidon.hash([this.source]);
    this.curValue = this.source;
    const result: [Int64, Int64, Int64, Int64] = [
      Int64.from(0),
      Int64.from(0),
      Int64.from(0),
      Int64.from(0),
    ];

    let bytes = this.curValue.toBits();

    for (let i = 0; i < 4; i++)
      result[i] = Int64.fromFields([
        Field.fromBits(bytes.slice(i * 64 + 1, (i + 1) * 64)),
      ]).mod(range[i]);

    return result;
  }

  // Get 3 numbers
  getNumbers(maxValue: number): [UInt32, UInt32, UInt32] {
    this.source = Poseidon.hash([this.source]);
    this.curValue = this.source;
    const result: [UInt32, UInt32, UInt32] = [
      UInt32.from(0),
      UInt32.from(0),
      UInt32.from(0),
    ];

    let bytes = this.curValue.toBits();

    for (let i = 0; i < 3; i++)
      result[i] = UInt32.fromFields([
        Field.fromBits(bytes.slice(i * 32 + 1, (i + 1) * 32)),
      ]).mod(maxValue);

    return result;
  }
}
