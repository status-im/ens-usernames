pragma solidity ^0.4.24;

import "../common/MerkleProof.sol";
import "../common/Controlled.sol";
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
    mapping (bytes32 => Account) public accounts;
    mapping (bytes32 => SlashReserve) reservedSlashers;

    //Slashing conditions
    uint256 public usernameMinLength;
    bytes32 public reservedUsernamesMerkleRoot;
    
    event RegistryState(RegistrarState state);
    event RegistryPrice(uint256 price);
    event RegistryMoved(address newRegistry);
    event UsernameOwner(bytes32 indexed nameHash, address owner);

    enum RegistrarState { Inactive, Active, Moved }
    bytes32 public ensNode;
    uint256 public price;
    RegistrarState public state;
    uint256 public reserveAmount;

    struct Account {
        uint256 balance;
        uint256 creationTime;
        address owner;
    }

    struct SlashReserve {
        address reserver;
        uint256 blockNumber;
    }

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
     * @param _usernameMinLength Minimum length of usernames 
     * @param _reservedUsernamesMerkleRoot Merkle root of reserved usernames
     * @param _parentRegistry Address of old registry (if any) for optional account migration.
     */
    constructor(
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot,
        address _parentRegistry
    ) 
        public 
    {
        require(address(_token) != address(0), "No ERC20Token address defined.");
        require(address(_ensRegistry) != address(0), "No ENS address defined.");
        require(address(_resolver) != address(0), "No Resolver address defined.");
        require(_ensNode != bytes32(0), "No ENS node defined.");
        token = _token;
        ensRegistry = _ensRegistry;
        resolver = _resolver;
        ensNode = _ensNode;
        usernameMinLength = _usernameMinLength;
        reservedUsernamesMerkleRoot = _reservedUsernamesMerkleRoot;
        parentRegistry = _parentRegistry;
        setState(RegistrarState.Inactive);
    }

    /**
     * @notice Registers `_label` username to `ensNode` setting msg.sender as owner.
     * Terms of name registration:
     * - SNT is deposited, not spent; the amount is locked up for 1 year.
     * - After 1 year, the user can release the name and receive their deposit back (at any time).
     * - User deposits are completely protected. The contract controller cannot access them.
     * - User's address(es) will be publicly associated with the ENS name.
     * - User must authorise the contract to transfer `price` `token.name()`  on their behalf.
     * - Usernames registered with less then `usernameMinLength` characters can be slashed.
     * - Usernames contained in the merkle tree of root `reservedUsernamesMerkleRoot` can be slashed.
     * - Usernames starting with `0x` and bigger then 12 characters can be slashed.
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
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        Account memory account = accounts[_label];
        require(account.creationTime > 0, "Username not registered.");
        if (state == RegistrarState.Active) {
            require(msg.sender == ensRegistry.owner(namehash), "Not owner of ENS node.");
            require(block.timestamp > account.creationTime + releaseDelay, "Release period not reached.");
        } else {
            require(msg.sender == account.owner, "Not the former account owner.");
        }
        delete accounts[_label];
        if (account.balance > 0) {
            reserveAmount -= account.balance;
            require(token.transfer(msg.sender, account.balance), "Transfer failed");
        }
        if (state == RegistrarState.Active) {
            ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, address(0));
            ensRegistry.setOwner(namehash, address(0));
        } else {
            address newOwner = ensRegistry.owner(ensNode);
            //Low level call, case dropUsername not implemented or failing, proceed release. 
            //Invert (!) to supress warning, return of this call have no use.
            !newOwner.call.gas(80000)(
                abi.encodeWithSignature(
                    "dropUsername(bytes32)",
                    _label
                )
            );
        }
        emit UsernameOwner(namehash, address(0));   
    }

    /** 
     * @notice update account owner, should be called by new ens node owner 
     * to update this contract registry, otherwise former owner can release 
     * if domain is moved to a new registry. 
     * @param _label Username hash.
     **/
    function updateAccountOwner(
        bytes32 _label
    ) 
        external 
    {
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        require(msg.sender == ensRegistry.owner(namehash), "Caller not owner of ENS node.");
        require(accounts[_label].creationTime > 0, "Username not registered.");
        require(ensRegistry.owner(ensNode) == address(this), "Registry not owner of registry.");
        accounts[_label].owner = msg.sender;
        emit UsernameOwner(namehash, msg.sender);
    }  

    /**
     * @notice secretly reserve the slashing reward to `msg.sender`
     * @param _secret keccak256(abi.encodePacked(namehash, creationTime, reserveSecret)) 
     */
    function reserveSlash(bytes32 _secret) external {
        require(reservedSlashers[_secret].blockNumber == 0, "Already Reserved");
        reservedSlashers[_secret] = SlashReserve(msg.sender, block.number);
    }

    /**
     * @notice Slash username smaller then `usernameMinLength`.
     * @param _username Raw value of offending username.
     */
    function slashSmallUsername(
        string _username,
        uint256 _reserveSecret
    ) 
        external 
    {
        bytes memory username = bytes(_username);
        require(username.length < usernameMinLength, "Not a small username.");
        slashUsername(username, _reserveSecret);
    }

    /**
     * @notice Slash username starting with "0x" and with length greater than 12.
     * @param _username Raw value of offending username.
     */
    function slashAddressLikeUsername(
        string _username,
        uint256 _reserveSecret
    ) 
        external 
    {
        bytes memory username = bytes(_username);
        require(username.length > 12, "Too small to look like an address.");
        require(username[0] == byte("0"), "First character need to be 0");
        require(username[1] == byte("x"), "Second character need to be x");
        for(uint i = 2; i < 7; i++){
            byte b = username[i];
            require((b >= 48 && b <= 57) || (b >= 97 && b <= 102), "Does not look like an address");
        }
        slashUsername(username, _reserveSecret);
    }  

    /**
     * @notice Slash username that is exactly a reserved name.
     * @param _username Raw value of offending username.
     * @param _proof Merkle proof that name is listed on merkle tree.
     */
    function slashReservedUsername(
        string _username,
        bytes32[] _proof,
        uint256 _reserveSecret
    ) 
        external 
    {   
        bytes memory username = bytes(_username);
        require(
            MerkleProof.verifyProof(
                _proof,
                reservedUsernamesMerkleRoot,
                keccak256(username)
            ),
            "Invalid Proof."
        );
        slashUsername(username, _reserveSecret);
    }

    /**
     * @notice Slash username that contains a non alphanumeric character.
     * @param _username Raw value of offending username.
     * @param _offendingPos Position of non alphanumeric character.
     */
    function slashInvalidUsername(
        string _username,
        uint256 _offendingPos,
        uint256 _reserveSecret
    ) 
        external
    { 
        bytes memory username = bytes(_username);
        require(username.length > _offendingPos, "Invalid position.");
        byte b = username[_offendingPos];
        
        require(!((b >= 48 && b <= 57) || (b >= 97 && b <= 122)), "Not invalid character.");
    
        slashUsername(username, _reserveSecret);
    }

    /**
     * @notice Clear resolver and ownership of unowned subdomians.
     * @param _labels Sequence to erase.
     */
    function eraseNode(
        bytes32[] _labels
    ) 
        external 
    {
        uint len = _labels.length;
        require(len != 0, "Nothing to erase");
        bytes32 label = _labels[len - 1];
        bytes32 subnode = keccak256(abi.encodePacked(ensNode, label));
        require(ensRegistry.owner(subnode) == address(0), "First slash/release top level subdomain");
        ensRegistry.setSubnodeOwner(ensNode, label, address(this));
        if(len > 1) {
            eraseNodeHierarchy(len - 2, _labels, subnode);
        }
        ensRegistry.setResolver(subnode, 0);
        ensRegistry.setOwner(subnode, 0);
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
        require(state == RegistrarState.Moved, "Wrong contract state");
        require(msg.sender == accounts[_label].owner, "Callable only by account owner.");
        require(ensRegistry.owner(ensNode) == address(_newRegistry), "Wrong update");
        Account memory account = accounts[_label];
        delete accounts[_label];

        token.approve(_newRegistry, account.balance);
        _newRegistry.migrateUsername(
            _label,
            account.balance,
            account.creationTime,
            account.owner
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
        require(state == RegistrarState.Inactive, "Registry state is not Inactive");
        require(ensRegistry.owner(ensNode) == address(this), "Registry does not own registry");
        price = _price;
        setState(RegistrarState.Active);
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
     * @notice Updates registration price.
     * @param _price New registration price.
     */
    function updateRegistryPrice(
        uint256 _price
    ) 
        external
        onlyController
    {
        require(state == RegistrarState.Active, "Registry not owned");
        price = _price;
        emit RegistryPrice(_price);
    }
  
    /**
     * @notice Transfer ownership of ensNode to `_newRegistry`.
     * Usernames registered are not affected, but they would be able to instantly release.
     * @param _newRegistry New UsernameRegistrar for hodling `ensNode` node.
     */
    function moveRegistry(
        UsernameRegistrar _newRegistry
    ) 
        external
        onlyController
    {
        require(_newRegistry != this, "Cannot move to self.");
        require(ensRegistry.owner(ensNode) == address(this), "Registry not owned anymore.");
        setState(RegistrarState.Moved);
        ensRegistry.setOwner(ensNode, _newRegistry);
        _newRegistry.migrateRegistry(price);
        emit RegistryMoved(_newRegistry);
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
        require(accounts[_label].creationTime == 0, "Already migrated");
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, _label));
        ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
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
        address _beneficiary
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
     * @return Registration price.
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
     * @return Locked username balance.
     **/
    function getAccountBalance(bytes32 _label)
        external
        view
        returns(uint256 accountBalance) 
    {
        accountBalance = accounts[_label].balance;
    }

    /**
     * @notice reads username account owner at this contract, 
     * which can release or migrate in case of upgrade.
     * @param _label Username hash.
     * @return Username account owner.
     **/
    function getAccountOwner(bytes32 _label)
        external
        view
        returns(address owner) 
    {
        owner = accounts[_label].owner;
    }

    /**
     * @notice reads when the account was registered 
     * @param _label Username hash.
     * @return Registration time.
     **/
    function getCreationTime(bytes32 _label)
        external
        view
        returns(uint256 creationTime) 
    {
        creationTime = accounts[_label].creationTime;
    }

    /**
     * @notice calculate time where username can be released 
     * @param _label Username hash.
     * @return Exact time when username can be released.
     **/
    function getReleaseTime(bytes32 _label)
        external
        view
        returns(uint256 releaseTime)
    {
        uint256 creationTime = accounts[_label].creationTime;
        if (creationTime > 0){
            releaseTime = creationTime + releaseDelay;
        }
    }

    /**
     * @notice calculate reward part an account could payout on slash 
     * @param _label Username hash.
     * @return Part of reward
     **/
    function getSlashRewardPart(bytes32 _label)
        external
        view
        returns(uint256 partReward)
    {
        uint256 balance = accounts[_label].balance;
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
        bytes _data
    ) 
        public
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
            sig == bytes4(0xb82fedbb), //bytes4(keccak256("register(bytes32,address,bytes32,bytes32)"))
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
        accounts[_label] = Account(_tokenBalance, _creationTime, _accountOwner);
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
        require(state == RegistrarState.Inactive, "Not Inactive");
        require(ensRegistry.owner(ensNode) == address(this), "ENS registry owner not transfered.");
        price = _price;
        setState(RegistrarState.Active);
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
        require(state == RegistrarState.Active, "Registry unavailable.");
        namehash = keccak256(abi.encodePacked(ensNode, _label));
        require(ensRegistry.owner(namehash) == address(0), "ENS node already owned.");
        require(accounts[_label].creationTime == 0, "Username already registered.");
        accounts[_label] = Account(price, block.timestamp, _owner);
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
    
        bool resolvePubkey = _pubkeyA != 0 || _pubkeyB != 0;
        bool resolveAccount = _account != address(0);
        if (resolvePubkey || resolveAccount) {
            //set to self the ownership to setup initial resolver
            ensRegistry.setSubnodeOwner(ensNode, _label, address(this));
            ensRegistry.setResolver(namehash, resolver); //default resolver
            if (resolveAccount) {
                resolver.setAddr(namehash, _account);
            }
            if (resolvePubkey) {
                resolver.setPubkey(namehash, _pubkeyA, _pubkeyB);
            }
            ensRegistry.setOwner(namehash, _owner);
        } else {
            //transfer ownership of subdone directly to registrant
            ensRegistry.setSubnodeOwner(ensNode, _label, _owner);
        }
        emit UsernameOwner(namehash, _owner);
    }
    
    /**
     * @dev Removes account hash of `_username` and send account.balance to msg.sender.
     * @param _username Username being slashed.
     */
    function slashUsername(
        bytes _username,
        uint256 _reserveSecret
    ) 
        internal 
    {
        bytes32 label = keccak256(_username);
        bytes32 namehash = keccak256(abi.encodePacked(ensNode, label));
        uint256 amountToTransfer = 0;
        uint256 creationTime = accounts[label].creationTime;
        address owner = ensRegistry.owner(namehash);
        if(creationTime == 0) {
            require(
                owner != address(0) ||
                ensRegistry.resolver(namehash) != address(0),
                "Nothing to slash."
            );
        } else {
            assert(creationTime != block.timestamp);
            amountToTransfer = accounts[label].balance;
            delete accounts[label];
        }

        ensRegistry.setSubnodeOwner(ensNode, label, address(this));
        ensRegistry.setResolver(namehash, address(0));
        ensRegistry.setOwner(namehash, address(0));
        
        if (amountToTransfer > 0) {
            reserveAmount -= amountToTransfer;
            uint256 partialDeposit = amountToTransfer / 3;
            amountToTransfer = partialDeposit * 2; // reserve 1/3 to network (controller)
            bytes32 secret = keccak256(abi.encodePacked(namehash, creationTime, _reserveSecret));
            SlashReserve memory reserve = reservedSlashers[secret];
            require(reserve.reserver != address(0), "Not reserved.");
            require(reserve.blockNumber < block.number, "Cannot reveal in same block");
            delete reservedSlashers[secret];

            require(token.transfer(reserve.reserver, amountToTransfer), "Error in transfer.");
        }
        emit UsernameOwner(namehash, address(0));
    }

    function setState(RegistrarState _state) private {
        state = _state;
        emit RegistryState(_state);
    }

    /**
     * @notice recursively erase all _labels in _subnode
     * @param _idx recursive position of _labels to erase
     * @param _labels list of subnode labes
     * @param _subnode subnode being erased
     */
    function eraseNodeHierarchy(
        uint _idx,
        bytes32[] _labels,
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
        ensRegistry.setResolver(subnode, 0);
        ensRegistry.setOwner(subnode, 0);
    }

    /**
     * @dev Decodes abi encoded data with selector for "register(bytes32,address,bytes32,bytes32)".
     * @param _data Abi encoded data.
     * @return Decoded registry call.
     */
    function abiDecodeRegister(
        bytes _data
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
            sig := mload(add(_data, add(0x20, 0)))
            label := mload(add(_data, 36))
            account := mload(add(_data, 68))
            pubkeyA := mload(add(_data, 100))
            pubkeyB := mload(add(_data, 132))
        }
    }
}
