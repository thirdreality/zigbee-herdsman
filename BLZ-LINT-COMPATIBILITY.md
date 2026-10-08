# BLZ lint compatibility boundaries

Normal BLZ adapter and UART code follow the upstream Biome rules. The three existing reflection codec files (`basic.ts`, `named.ts`, `struct.ts`) retain four narrow exceptions:

- Naming: exported integer codec names and firmware constant/property names are part of the existing API and reflective value-name lookup. Renaming them requires a separate compatibility migration.
- Explicit `any`: the legacy codec factory/field tables mix constructors and heterogeneous values. Replacing these with `unknown` without typed descriptors would move unchecked casts to every caller. A future codec redesign must separate value types from descriptors and preserve wire encoding; this change does not claim to complete that redesign.
- Static-only classes and static `super`: codecs deliberately use class inheritance and static metadata to select serialization behavior.

Four heterogeneous index signatures in `commands.ts` and `blz.ts` have line-level exemptions for the same reflection boundary. The exemptions do not cover adapter behavior, serial I/O, tests, formatting, unused code, null checks, or asynchronous contracts. All other lint rules remain enabled, including within the codec files.
