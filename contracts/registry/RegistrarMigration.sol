pragma solidity >=0.5.0 <0.6.0;

import "../common/MerkleProof.sol";
import "../common/Controlled.sol";
import "../token/ERC20Token.sol";
import "../ens/ENS.sol";
import "../ens/PublicResolver.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Registers usernames as ENS subnodes of the domain `ensNode`
 */
contract UsernameRegistrar is Controlled {

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
     */
    constructor(
        ENS _ensRegistry,
        bytes32 _ensNode
    )
        public
    {
        require(address(_ensRegistry) != address(0), "No ENS address defined.");
        ensNode = _ensNode;
        ensRegistry = _ensRegistry;
    }


    /**
     * @notice Transfers _domainHash ENS node to _beneficiary
     * @param _domainHash Ens node namehash.
     * @param _beneficiary New owner of ens node.
     **/
    function transferENSNode(
        bytes32 _domainHash,
        address _beneficiary
    )
        external
        onlyController
    {
        require(_beneficiary != address(0), "Cannot burn node");
        ensRegistry.setOwner(_domainHash, _beneficiary);
    }

    /**
     * @notice Withdraw tokens
     * @param _token Address of ERC20 withdrawing excess, or address(0) if want ETH.
     * @param _beneficiary Address to send the funds.
     **/
    function transferTokens(
        address _token,
        address payable _beneficiary
    )
        external
        onlyController
    {
        require(_beneficiary != address(0), "Cannot burn token");
        if (_token == address(0)) {
            _beneficiary.transfer(address(this).balance);
        } else {
            ERC20Token excessToken = ERC20Token(_token);
            uint256 amount = excessToken.balanceOf(address(this));
            require(amount > 0, "No balance");
            excessToken.transfer(_beneficiary, amount);
        }
    }

    function execute(address _to, uint256 _value, bytes calldata _data) external onlyController {
        _to.call.value(_value)(_data);
    }

    /**
     * @notice Opt-out migration of username from `parentRegistry()`.
     */
    function dropUsername(
        bytes32
    )
        external
        onlyParentRegistry
    {
        return;
    }

    function migrateUsername(
        bytes32,
        uint256,
        uint256,
        address
    )
        external
        onlyParentRegistry
    {
        revert("Disabled");
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
