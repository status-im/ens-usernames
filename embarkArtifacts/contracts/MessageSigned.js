import EmbarkJS from '../embarkjs';

const MessageSignedConfig = {"logger":{"events":{"domain":null,"_events":{"servicesState":[null,null],"blockchain:started":[null,null,null,null,null,null,null,null,null],"outputDone":[null,null,null,null,null,null],"storage:started":[null,null]},"_eventsCount":150,"_maxListeners":350},"logLevels":["error","warn","info","debug","trace"],"logLevel":"info","context":["run","build"]},"abiDefinition":[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}],"className":"MessageSigned","args":[],"gas":"auto","silent":false,"track":true,"deploy":false,"realRuntimeBytecode":"","realArgs":[],"code":"","runtimeBytecode":"","linkReferences":{},"swarmHash":"","gasEstimates":null,"functionHashes":{},"filename":"/home/petty/GitHub/status-im/ens-usernames/.embark/contracts/common/MessageSigned.sol","originalFilename":"contracts/common/MessageSigned.sol","path":"/home/petty/GitHub/status-im/ens-usernames/contracts/common/MessageSigned.sol","type":"file"};
const MessageSigned = new EmbarkJS.Blockchain.Contract(MessageSignedConfig);

export default MessageSigned;
