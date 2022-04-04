// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "../common/Controlled.sol";
import "./UsernameToken.sol";
import "../token/ERC20Token.sol";
import "../token/ApproveAndCallFallBack.sol";
import "../ens/ENS.sol";
import "../ens/PublicResolver.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Registers usernames as ENS subnodes of the domain `ensNode`
 */
contract UsernameRegistrar is Controlled, ApproveAndCallFallBack {

    ERC20Token public token;
    ENS public ensRegistry;
    PublicResolver public resolver;
    address public parentRegistry;

    uint256 public constant releaseDelay = 365 days;

    UsernameToken public accounts;
    uint256 public lastUpdate;
    address public slashMechanism;
    
    event RegistryPrice(uint256 price);
    event RegistryMoved(address newRegistry);
    event UsernameOwner(bytes32 indexed nameHash, address owner);

    enum RegistrarState { Inactive, Active, Moved }
    bytes32 public ensNode;
    uint256 public price;
    bool public activated;
    uint256 public reserveAmount;

    mapping (bytes32 => bool) public migrated;


    /**
     * @notice Callable only by `parentRegistry()` to continue migration of ENSSubdomainRegistry.
     */
    modifier onlyParentRegistry {
        require(msg.sender == parentRegistry, "Migration only.");
        _;
    }

    /**
     * @notice Initializes UsernameRegistrar contract.
     * The only parameter from this list that can be changed later is `_resolver`.
     * Other updates require a new contract and migration of domain.
     * @param _token ERC20 token with optional `approveAndCall(address,uint256,bytes)` for locking fee.
     * @param _ensRegistry Ethereum Name Service root contract address. 
     * @param _resolver Public Resolver for resolving usernames.
     * @param _ensNode ENS node (domain) being used for usernames subnodes (subdomain)
     * @param _slashMechanism Slashing mechanism address
     * @param _parentRegistry Address of old registry (if any) for optional account migration.
     */
    constructor(
        UsernameToken _accounts,
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        address _slashMechanism,
        address _parentRegistry
    )
        Controlled(msg.sender)
    {
        require(address(_token) != address(0), "No ERC20Token address defined.");
        require(address(_ensRegistry) != address(0), "No ENS address defined.");
        require(address(_resolver) != address(0), "No Resolver address defined.");
        require(_ensNode != bytes32(0), "No ENS node defined.");
        accounts = _accounts;
        token = _token;
        ensRegistry = _ensRegistry;
        resolver = _resolver;
        ensNode = _ensNode;
        slashMechanism = _slashMechanism;
        lastUpdate = block.timestamp;
        parentRegistry = _parentRegistry;
        activated = false;
    }

    /**
     * @notice Registers `_label` username to `ensNode` setting msg.sender as owner.
     * Terms of name registration:
     * - SNT is deposited, not spent; the amount is locked up for 1 year.
     * - After 1 year, the user can release the name and receive their deposit back (at any time).
     * - User deposits are completely protected. The contract controller cannot access them.
     * - User's address(es) will be publicly associated with the ENS name.
     * - User must authorise the contract to transfer `price` `token.name()`  on their behalf.
     * - Usernames registered can be slashed if offending the `slashMechanism` contract rules.
     * - If terms of the contract change—e.g. Status makes contract upgrades—the user has the right to release the username and get their deposit back.
     * @param _label Choosen unowned username hash.
     * @param _account Optional address to set at public resolver.
     * @param _pubkeyA Optional pubkey part A to set at public resolver.
     * @param _pubkeyB Optional pubkey part B to set at public resolver.
     */
    function register(
        bytes32 _label,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    )
        external
        returns(bytes32 namehash)
    {
        return registerUser(msg.sender, _label, _account, _pubkeyA, _pubkeyB);
    }

    /**
     * @notice Release username and retrieve locked fee, needs to be called
     * after `releasePeriod` from creation time by ENS registry owner of domain
     * or anytime by account owner when domain migrated to a new registry.
     * @param _label Username hash.
     */
    function release(
        bytes32 _label
    )
        external
    {
        require(accounts.isApprovedOrOwner(msg.sender, _label), "not approved or not owner");
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        (uint256 balance, uint256 creationTime) = accounts.accounts(_label);
        address owner = accounts.ownerOf(uint256(_label));
        if (getState() == RegistrarState.Active) {
            require(block.timestamp > creationTime + releaseDelay || lastUpdate > creationTime, "Release period not reached.");
        }
        if (balance > 0) {
            reserveAmount -= balance;
            require(token.transfer(owner, balance), "Transfer failed");
        }
        if (getState() == RegistrarState.Active) {
            accounts.deleteUser(_label);
            ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, address(0));
            ensRegistry.setOwner(namehash, address(0));
        } else {
            require(!migrated[_label], "Already migrated");
            migrated[_label] = true;
            address newRegistry = ensRegistry.owner(ensNode);
            try UsernameRegistrar(newRegistry).dropUsername(_label) {

            } catch (bytes memory) {
                
            }
        }
        emit UsernameOwner(namehash, address(0));
    }
    
    /*
     * @dev Reclaim ownership of a name in ENS, if you own it in the registrar.
     */
    function reclaim(bytes32 _label, address _owner) external {
        require(getState() == RegistrarState.Active, "Registry not owned");
        require(accounts.isApprovedOrOwner(msg.sender, _label), "Not approved nor owner");
        ensRegistry.setSubnodeOwner(ensNode, bytes32(_label), _owner);
    }


    /**
     * @notice Clear resolver and ownership of unowned subdomians.
     * @param _labels Sequence to erase.
     */
    function eraseNode(
        bytes32[] calldata _labels
    )
        external
    {
        uint len = _labels.length;
        require(len != 0, "Nothing to erase");
        bytes32 label = _labels[len - 1];
        bytes32 subnode = keccak256(abi.encodePacked(ensNode, label));
        require(!accounts.exists(label), "First slash/release top level subdomain");
        ensRegistry.setSubnodeOwner(ensNode, label, address(this));
        if(len > 1) {
            eraseNodeHierarchy(len - 2, _labels, subnode);
        }
        ensRegistry.setResolver(subnode, address(0));
        ensRegistry.setOwner(subnode, address(0));
    }

    /**
     * @notice Migrate account to new registry, opt-in to new contract.
     * @param _label Username hash.
     **/
    function moveAccount(
        bytes32 _label,
        UsernameRegistrar _newRegistry
    )
        external
    {
        require(!migrated[_label], "Already migrated");
        migrated[_label] = true;
        require(accounts.isApprovedOrOwner(msg.sender, _label), "Not approved nor owner");
        require(getState() == RegistrarState.Moved, "Wrong contract state");
        address owner = accounts.ownerOf(uint256(_label));
        (uint256 balance, uint256 creationTime) = accounts.accounts(_label);
        require(ensRegistry.owner(ensNode) == address(_newRegistry), "Wrong update");
        
        token.approve(address(_newRegistry), balance);
        _newRegistry.migrateUsername(
            _label,
            balance,
            creationTime,
            owner
        );
        
    }

    /**
     * @notice Activate registration.
     * @param _price The price of registration.
     */
    function activate(
        uint256 _price
    )
        external
        onlyController
    {
        require(getState() == RegistrarState.Inactive, "Registry state is not Inactive");
        require(accounts.controller() == address(this), "UsernameToken is not controlled");
        require(ensRegistry.owner(ensNode) == address(this), "Registry does not own registry");
        price = _price;
        activated = true;
        emit RegistryPrice(_price);
    }

    /**
     * @notice Updates Public Resolver for resolving users.
     * @param _resolver New PublicResolver.
     */
    function setResolver(
        address _resolver
    )
        external
        onlyController
    {
        resolver = PublicResolver(_resolver);
    }

    /** 
     * @notice Updates slash mechanism.
     * @param _slashMechanism New Slash Mechanism
     */
    function setSlashMechanism(
        address _slashMechanism
    ) 
        external
        onlyController
    {
        lastUpdate = block.timestamp;
        require(_slashMechanism != address(0), "Zero address for _slashMechanism");
        slashMechanism = _slashMechanism;
    }

    /**
     * @notice Updates registration price.
     * @param _price New registration price.
     */
    function updateRegistryPrice(
        uint256 _price
    )
        external
        onlyController
    {
        require(getState() == RegistrarState.Active, "Registry not owned");
        price = _price;
        emit RegistryPrice(_price);
    }

    /**
     * @notice Migrate price to `_newRegistry`.
     * ENS node must be moved by reclaiming it into `_newRegistry`.
     * @param _newRegistry New UsernameRegistrar hodling `ensNode` node.
     */
    function moveRegistry(
        UsernameRegistrar _newRegistry
    )
        external
        onlyController
    {
        require(address(_newRegistry) != address(this), "Cannot move to self.");
        address newRegistry = ensRegistry.owner(ensNode);
        require(address(_newRegistry) == newRegistry, "Wrong parameter");
        accounts.changeController(payable(address(_newRegistry)));
        _newRegistry.migrateRegistry(price);
        emit RegistryMoved(newRegistry);
    }

    /**
     * @notice Opt-out migration of username from `parentRegistry()`.
     * Clear ENS resolver and subnode owner.
     * @param _label Username hash.
     */
    function dropUsername(
        bytes32 _label
    )
        external
        onlyParentRegistry
    {
        (, uint256 creationTime) = accounts.accounts(_label);
        require(creationTime != 0, "Already dropped");
        accounts.deleteUser(_label);
        bytes32 namehash = ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
        ensRegistry.setResolver(namehash, address(0));
        ensRegistry.setOwner(namehash, address(0));
    }

    /**
     * @notice Withdraw not reserved tokens
     * @param _token Address of ERC20 withdrawing excess, or address(0) if want ETH.
     * @param _beneficiary Address to send the funds.
     **/
    function withdrawExcessBalance(
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
            if(_token == address(token)){
                require(amount > reserveAmount, "Is not excess");
                amount -= reserveAmount;
            } else {
                require(amount > 0, "No balance");
            }
            excessToken.transfer(_beneficiary, amount);
        }
    }

    /**
     * @notice Withdraw ens nodes not belonging to this contract.
     * @param _domainHash Ens node namehash.
     * @param _beneficiary New owner of ens node.
     **/
    function withdrawWrongNode(
        bytes32 _domainHash,
        address _beneficiary
    )
        external
        onlyController
    {
        require(_beneficiary != address(0), "Cannot burn node");
        require(_domainHash != ensNode, "Cannot withdraw main node");
        require(ensRegistry.owner(_domainHash) == address(this), "Not owner of this node");
        ensRegistry.setOwner(_domainHash, _beneficiary);
    }

    /**
     * @notice Gets registration price.
     * @return registryPrice Registration price.
     **/
    function getPrice()
        external
        view
        returns(uint256 registryPrice)
    {
        return price;
    }

    /**
     * @notice reads amount tokens locked in username
     * @param _label Username hash.
     * @return accountBalance Locked username balance.
     **/
    function getAccountBalance(bytes32 _label)
        external
        view
        returns(uint256 accountBalance)
    {
        (accountBalance, ) = accounts.accounts(_label);
    }

    /**
     * @notice reads username account owner at this contract,
     * which can release or migrate in case of upgrade.
     * @param _label Username hash.
     * @return owner Username account owner.
     **/
    function getAccountOwner(bytes32 _label)
        external
        view
        returns(address owner)
    {
        owner = accounts.ownerOf(uint256(_label));
    }

    /**
     * @notice reads when the account was registered
     * @param _label Username hash.
     * @return creationTime Registration time.
     **/
    function getCreationTime(bytes32 _label)
        external
        view
        returns(uint256 creationTime)
    {
        (, creationTime) = accounts.accounts(_label);
    }

    /**
     * @notice calculate time where username can be released
     * @param _label Username hash.
     * @return releaseTime Exact time when username can be released.
     **/
    function getExpirationTime(bytes32 _label)
        external
        view
        returns(uint256 releaseTime)
    {
        
        (, uint256 creationTime) = accounts.accounts(_label);
        if (creationTime > 0){
            releaseTime = creationTime + releaseDelay;
        }
    }

    /**
     * @notice calculate reward part an account could payout on slash
     * @param _label Username hash.
     * @return partReward Part of reward
     **/
    function getSlashRewardPart(bytes32 _label)
        external
        view
        returns(uint256 partReward)
    {
        (uint256 balance, ) = accounts.accounts(_label);
        if (balance > 0) {
            partReward = balance / 3;
        }
    }

    /**
     * @notice Support for "approveAndCall". Callable only by `token()`.
     * @param _from Who approved.
     * @param _amount Amount being approved, need to be equal `getPrice()`.
     * @param _token Token being approved, need to be equal `token()`.
     * @param _data Abi encoded data with selector of `register(bytes32,address,bytes32,bytes32)`.
     */
    function receiveApproval(
        address _from,
        uint256 _amount,
        address _token,
        bytes memory _data
    )
        public
        override
    {
        require(_amount == price, "Wrong value");
        require(_token == address(token), "Wrong token");
        require(_token == address(msg.sender), "Wrong call");
        require(_data.length <= 132, "Wrong data length");
        bytes4 sig;
        bytes32 label;
        address account;
        bytes32 pubkeyA;
        bytes32 pubkeyB;
        (sig, label, account, pubkeyA, pubkeyB) = abiDecodeRegister(_data);
        require(
            sig == this.register.selector,
            "Wrong method selector"
        );
        registerUser(_from, label, account, pubkeyA, pubkeyB);
    }

    /**
     * @notice Continues migration of username to new registry.
     * @param _label Username hash.
     * @param _tokenBalance Amount being transfered from `parentRegistry()`.
     * @param _creationTime Time user registrated in `parentRegistry()` is preserved.
     * @param _accountOwner Account owner which migrated the account.
     **/
    function migrateUsername(
        bytes32 _label,
        uint256 _tokenBalance,
        uint256 _creationTime,
        address _accountOwner
    )
        external
        onlyParentRegistry
    {
        if (_tokenBalance > 0) {
            require(
                token.transferFrom(
                    parentRegistry,
                    address(this),
                    _tokenBalance
                ),
                "Error moving funds from old registar."
            );
            reserveAmount += _tokenBalance;
        }
        accounts.importUser(_accountOwner, _label, _tokenBalance, _creationTime);
    }

    /**
     * @dev callable only by parent registry to continue migration
     * of registry and activate registration.
     * @param _price The price of registration.
     **/
    function migrateRegistry(
        uint256 _price
    )
        external
        onlyParentRegistry
    {
        require(getState() == RegistrarState.Inactive, "Not Inactive");
        require(ensRegistry.owner(ensNode) == address(this), "ENS registry owner not transfered.");
        price = _price;
        activated = true;
        emit RegistryPrice(_price);
    }

    /**
     * @notice Registers `_label` username to `ensNode` setting msg.sender as owner.
     * @param _owner Address registering the user and paying registry price.
     * @param _label Choosen unowned username hash.
     * @param _account Optional address to set at public resolver.
     * @param _pubkeyA Optional pubkey part A to set at public resolver.
     * @param _pubkeyB Optional pubkey part B to set at public resolver.
     */
    function registerUser(
        address _owner,
        bytes32 _label,
        address _account,
        bytes32 _pubkeyA,
        bytes32 _pubkeyB
    )
        internal
        returns(bytes32 namehash)
    {
        require(getState() == RegistrarState.Active, "Registry not active.");      
        require(!accounts.exists(_label), "Username already registered.");
        if(price > 0) {
            require(token.allowance(_owner, address(this)) >= price, "Unallowed to spend.");
            require(
                token.transferFrom(
                    _owner,
                    address(this),
                    price
                ),
                "Transfer failed"
            );
            reserveAmount += price;
        }
        accounts.createUser(_owner, _label, price);
        bool resolvePubkey = _pubkeyA != 0 || _pubkeyB != 0;
        bool resolveAccount = _account != address(0);
        if (resolvePubkey || resolveAccount) {
            //set to self the ownership to setup initial resolver
            namehash = ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, address(resolver)); //default resolver
            if (resolveAccount) {
                resolver.setAddr(namehash, _account);
            }
            if (resolvePubkey) {
                resolver.setPubkey(namehash, _pubkeyA, _pubkeyB);
            }
            ensRegistry.setOwner(namehash, _owner);
        } else {
            //transfer ownership of subdone directly to registrant
            namehash = ensRegistry.setSubnodeOwner(ensNode, _label, _owner);
        }
        emit UsernameOwner(namehash, _owner);
    }

    /**
     * @dev Removes account hash of `_username` and send account.balance to msg.sender.
     * @param _username Username being slashed.
     */
    function slashUsername(
        string calldata _username,
        address _reserver
    ) 
        external 
    {
        require(msg.sender == slashMechanism, "Unauthorized");
        bytes32 label = keccak256(bytes(_username));
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, label));
        (uint256 amountToTransfer, uint256 creationTime) = accounts.accounts(label);
        address owner = accounts.ownerOf(uint256(label));
        address beneficiary = _reserver;
        if(creationTime == 0) {
            require(
                owner != address(0) ||
                ensRegistry.resolver(namehash) != address(0),
                "Nothing to slash."
            );
        } else {
            assert(creationTime != block.timestamp);
            if(lastUpdate > creationTime) {
                beneficiary = owner;
            }
            accounts.deleteUser(label);
        }

        ensRegistry.setSubnodeOwner(ensNode, label, address(this));
        ensRegistry.setResolver(namehash, address(0));
        ensRegistry.setOwner(namehash, address(0));

        if (amountToTransfer > 0) {
            reserveAmount -= amountToTransfer;
            if(lastUpdate < creationTime) {
                amountToTransfer = (amountToTransfer * 2) / 3; // reserve 1/3 to network (controller)
            }
            require(token.transfer(beneficiary, amountToTransfer), "Error in transfer.");
        }
        emit UsernameOwner(namehash, address(0));
    }

    /**
     * @notice Reads state of registrar.
     */
    function getState()
        public
        view
        returns(RegistrarState state)
    {
        if(!activated){
            return RegistrarState.Inactive;
        } else {
            return ensRegistry.owner(ensNode) == address(this) ? RegistrarState.Active : RegistrarState.Moved;
        }
    }

    /**
     * @notice recursively erase all _labels in _subnode
     * @param _idx recursive position of _labels to erase
     * @param _labels list of subnode labes
     * @param _subnode subnode being erased
     */
    function eraseNodeHierarchy(
        uint _idx,
        bytes32[] memory _labels,
        bytes32 _subnode
    )
        private
    {
        // Take ownership of the node
        ensRegistry.setSubnodeOwner(_subnode, _labels[_idx], address(this));
        bytes32 subnode = keccak256(abi.encodePacked(_subnode, _labels[_idx]));

        // Recurse if there are more labels
        if (_idx > 0) {
            eraseNodeHierarchy(_idx - 1, _labels, subnode);
        }

        // Erase the resolver and owner records
        ensRegistry.setResolver(subnode, address(0));
        ensRegistry.setOwner(subnode, address(0));
    }

    /**
     * @dev Decodes abi encoded data with selector for "register(bytes32,address,bytes32,bytes32)".
     * @param _data Abi encoded data.
     * @return sig Decoded first 4 bytes.
     * @return label Decoded label.
     * @return account Decoded account.
     * @return pubkeyA Decoded pubkeyA.
     * @return pubkeyB Decoded pubkeyB.
     */
    function abiDecodeRegister(
        bytes memory _data
    )
        private
        pure
        returns(
            bytes4 sig,
            bytes32 label,
            address account,
            bytes32 pubkeyA,
            bytes32 pubkeyB
        )
    {
        assembly {
            sig := mload(add(_data, 32))
            label := mload(add(_data, 36))
            account := mload(add(_data, 68))
            pubkeyA := mload(add(_data, 100))
            pubkeyB := mload(add(_data, 132))
        }
    }
}
