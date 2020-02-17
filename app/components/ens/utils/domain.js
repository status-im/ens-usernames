import EmbarkJS from 'Embark/EmbarkJS';
import ENSRegistry from '../../../../embarkArtifacts/contracts/ENSRegistry';
import PublicResolver from '../../../../embarkArtifacts/contracts/PublicResolver';

const { methods: { owner, resolver } } = ENSRegistry;

export const nullAddress = '0x0000000000000000000000000000000000000000';
export const getResolver = async node => {
  const resolverAddress = await resolver(node).call();
  return resolverAddress !== nullAddress
    ? new EmbarkJS.Blockchain.Contract({ abi: PublicResolver._jsonInterface, address: resolverAddress, web3 })
    : PublicResolver
}
