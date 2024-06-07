# Status ENS Usernames

DApp to register usernames for Status Network, using ENS subnodes as usernames and Public Resolver to configure public
key and/or public address.

### Stateofus.eth Terms of name registration

- Funds are deposited for 1 year. Your SNT will be locked, but not spent.
- After 1 year, the user can release the name for being registered again, and receive their deposit back.
- Usernames are created as a subdomain of `stateofus.eth` [ENS domain](https://ens.domains/).
- Usernames not allowed are less then 4 characters, or contained in this list (link to list), or starts with `0x` and
  more then 12 characters.
- Revealing a registered not allowed username will result in loss of deposit and removal of username.
- Users are free to own the subdomains, but they are property of Status Network, and might be subject of new terms.
- If terms of the contract change—e.g. Status Network makes contract upgrades—the user has the right to get their
  deposit back and release the username, or do nothing and keep using username as long new contract allows it.
- User's handle (name) is always secret to network until user reveals it to someone.
- User's address(es) when associated with a username will be publicly visible.

## Usage

This is a list of the most frequently needed commands.

### Build

Build the contracts:

```sh
$ forge build
```

### Clean

Delete the build artifacts and cache directories:

```sh
$ forge clean
```

### Compile

Compile the contracts:

```sh
$ forge build
```

### Coverage

Get a test coverage report:

```sh
$ forge coverage
```

### Deploy

Deploy to Anvil:

```sh
$ forge script script/Deploy.s.sol --broadcast --fork-url http://localhost:8545
```

For this script to work, you need to have a `MNEMONIC` environment variable set to a valid
[BIP39 mnemonic](https://iancoleman.io/bip39/).

For instructions on how to deploy to a testnet or mainnet, check out the
[Solidity Scripting](https://book.getfoundry.sh/tutorials/solidity-scripting.html) tutorial.

### Format

Format the contracts:

```sh
$ forge fmt
```

### Gas Usage

Get a gas report:

```sh
$ forge test --gas-report
```

### Lint

Lint the contracts:

```sh
$ pnpm lint
```

#### Fixing linting issues

For any errors in solidity files, run `forge fmt`. For errors in any other file type, run `pnpm prettier:write`.

### Test

Run the tests:

```sh
$ forge test
```

## Deployment Details

| Contract                   | Ropsten Address                            | Mainnet Address                            |
| -------------------------- | ------------------------------------------ | ------------------------------------------ |
| ens/ENSRegistry            | 0x112234455c3a32fd11230c42e7bccd4a84e02010 | 0x314159265dd8dbb310642f98f50c066173c1259b |
| ens/PublicResolver         | 0x29754bADB2640b98F6deF0f52D41418b0d2e0C51 | 0x5FfC014343cd971B7eb70732021E26C35B744cc4 |
| token/TestToken            | 0xc55cF4B03948D7EBc8b9E8BAD92643703811d162 | 0x744d70fdbe2ba4cf95131626614a1763df805b9e |
| registry/UsernameRegistrar | 0x028F3Df706c5295Ba283c326F4692c375D14cb68 | 0xDBf9038cf5Aaa030890790dB87E746E00Fc352b3 |
| common/MerkleProof         | 0x5df00E70AD165D50228DB6d8285fB6EAAc630FD7 | 0x713ED9846463235df08D92B886938651105D3940 |
| test/MerkleProofWrapper    | 0x58E01078d14142E0370526dFdAE44E4f508c844B | 0x76E55E13C5891a90f7fCA2e1238a6B3463F564e2 |
| common/SafeMath            | 0x0F9992f7737f9ba3aceD170D4D1259cb2CEcc050 | 0xA115a57952D3337e2a1aB3Cb82bA376EEcDDc469 |
