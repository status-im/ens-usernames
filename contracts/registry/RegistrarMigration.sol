pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";
import "../ens/ENS.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Registers usernames as ENS subnodes of the domain `ensNode`
 */
contract RegistrarMigration is Controlled {

    ENS public ensRegistry;
    bytes32 public ensNode;
    address public parentRegistry;

    /**
     * @notice Callable only by `parentRegistry()` to continue migration of ENSSubdomainRegistry.
     */
    modifier onlyParentRegistry {
        require(msg.sender == parentRegistry, "Migration only.");
        _;
    }

    /**
     * @param _ensRegistry Ethereum Name Service root contract address.
     * @param _ensNode ensNode to be automatically transferred on migration from UsernameRegistrar to Controller
     * @param _parentRegistry contract allowed to interact with this
     */
    constructor(
        ENS _ensRegistry,
        bytes32 _ensNode,
        address _parentRegistry
    )
        public
    {
        require(address(_ensRegistry) != address(0), "No ENS address defined.");
        require(address(_parentRegistry) != address(0), "No parent registry address defined.");
        ensNode = _ensNode;
        ensRegistry = _ensRegistry;
        parentRegistry = _parentRegistry;
    }

    /**
     * @notice Controller can do anything.
     */
    function execute(address _to, uint256 _value, bytes calldata _data) external onlyController {
        _to.call.value(_value)(_data);
    }

    /**
     * @dev callable only by parent registry to continue migration.
     **/
    function migrateRegistry(
        uint256
    )
        external
        onlyParentRegistry
    {
        ensRegistry.setOwner(ensNode, controller);
    }

}
