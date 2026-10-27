import PolyHelperError from '../private/error.ts';

const decoder = new TextDecoder('utf-8');

type PoolEntry =
  | { tag: 1; value: string }
  | { tag: 7 | 8 | 16 | 19 | 20; index: number }
  | { tag: 9 | 10 | 11 | 12 | 17 | 18; first: number; second: number }
  | { tag: 3 | 4 | 5 | 6 | 15 }
  | null;

class Reader {
  offset = 0;
  constructor(private readonly view: DataView) {}

  u1(): number {
    return this.view.getUint8(this.offset++);
  }

  u2(): number {
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }

  u4(): number {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  skip(bytes: number) {
    this.offset += bytes;
  }

  bytes(length: number): Uint8Array {
    const value = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
    this.offset += length;
    return value;
  }
}

function readPool(reader: Reader): PoolEntry[] {
  const count = reader.u2();
  const pool: PoolEntry[] = [null];
  for (let index = 1; index < count; index++) {
    const tag = reader.u1();
    switch (tag) {
      case 1:
        pool.push({ tag, value: decoder.decode(reader.bytes(reader.u2())) });
        break;
      case 7:
      case 8:
      case 16:
      case 19:
      case 20:
        pool.push({ tag, index: reader.u2() });
        break;
      case 9:
      case 10:
      case 11:
      case 12:
      case 17:
      case 18:
        pool.push({ tag, first: reader.u2(), second: reader.u2() });
        break;
      case 3:
      case 4:
        reader.skip(4);
        pool.push({ tag });
        break;
      case 5:
      case 6:
        reader.skip(8);
        pool.push({ tag }, null);
        index++;
        break;
      case 15:
        reader.skip(3);
        pool.push({ tag });
        break;
      default:
        throw new PolyHelperError(`Unknown constant pool tag ${tag}`);
    }
  }
  return pool;
}

function utf8At(pool: PoolEntry[], index: number): string {
  const entry = pool[index];
  return entry?.tag === 1 ? entry.value : '';
}

function classAt(pool: PoolEntry[], index: number): string {
  const entry = pool[index];
  return entry?.tag === 7 ? utf8At(pool, entry.index) : '';
}

function skipAttributes(reader: Reader) {
  const count = reader.u2();
  for (let i = 0; i < count; i++) {
    reader.skip(2);
    reader.skip(reader.u4());
  }
}

export interface MemberRef {
  owner: string;
  name: string;
  descriptor: string;
}

export interface ClassFileInfo {
  name: string;
  superName: string | null;
  interfaces: string[];
  methods: string[];
  utf8: string[];
  strings: string[];
  methodRefs: MemberRef[];
}

export function parseClassFile(data: Uint8Array): ClassFileInfo {
  const reader = new Reader(new DataView(data.buffer, data.byteOffset, data.byteLength));
  if (reader.u4() !== 0xcafebabe) throw new PolyHelperError('Not a class file');
  reader.skip(4);
  const pool = readPool(reader);
  reader.skip(2);
  const name = classAt(pool, reader.u2());
  const superIndex = reader.u2();
  const interfaces = Array.from({ length: reader.u2() }, () => classAt(pool, reader.u2()));

  const fieldCount = reader.u2();
  for (let i = 0; i < fieldCount; i++) {
    reader.skip(6);
    skipAttributes(reader);
  }
  const methods: string[] = [];
  const methodCount = reader.u2();
  for (let i = 0; i < methodCount; i++) {
    reader.skip(2);
    methods.push(utf8At(pool, reader.u2()));
    reader.skip(2);
    skipAttributes(reader);
  }

  const utf8: string[] = [];
  const strings: string[] = [];
  const methodRefs: MemberRef[] = [];
  for (const entry of pool) {
    if (!entry) continue;
    if (entry.tag === 1) utf8.push(entry.value);
    if (entry.tag === 8) strings.push(utf8At(pool, entry.index));
    if (entry.tag === 10 || entry.tag === 11) {
      const nameAndType = pool[entry.second];
      if (nameAndType?.tag !== 12) continue;
      methodRefs.push({
        owner: classAt(pool, entry.first),
        name: utf8At(pool, nameAndType.first),
        descriptor: utf8At(pool, nameAndType.second)
      });
    }
  }

  return {
    name,
    superName: superIndex === 0 ? null : classAt(pool, superIndex),
    interfaces,
    methods,
    utf8,
    strings,
    methodRefs
  };
}
