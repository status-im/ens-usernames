pragma solidity 0.6.7;

import "../common/MerkleTreeWithHistory.sol";
import "../common/ReentrancyGuard.sol";
import "../common/MessageSigned.sol";

contract IVerifier {
    function verifyProof(bytes memory _proof, uint256[6] memory _input) public returns(bool);
}

contract SafeUsernameRegistrar is MerkleTreeWithHistory, ReentrancyGuard, UsernameRegistrar, MessageSigned {
    mapping(bytes32 => bool) public nullifierHashes;
    // we store all commitments just to prevent accidental deposits with the same commitment
    mapping(bytes32 => bool) public commitments;
    IVerifier public verifier;

    event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event Spend(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);

    constructor(
        IVerifier _verifier,
        uint32 _merkleTreeHeight,
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot,
        address _parentRegistry
    )
        MerkleTreeWithHistory(_merkleTreeHeight)
        UsernameRegistrar(
            _token,
            _ensRegistry,
            _resolver,
            _ensNode,
            _usernameMinLength,
            _reservedUsernamesMerkleRoot,
            _parentRegistry
        ) public {
        verifier = _verifier;
        operator = _operator;
    }

    function secureRegister(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _chatKey,
        address payable _relayer,
        uint256 _fee,
        bytes calldata _data,
        bytes calldata _messageSignature
    ) external payable nonReentrant {
        require(_fee <= price, "Fee exceeds transfer value");
        require(!nullifierHashes[_nullifierHash], "The note has been already spent");
        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
        require(
            _chatKey == recoverAddress(getSignHash(keccak256(abi.encodePacked(_proof, uint256(_relayer), _fee, _data)), _messageSignature)),
            "Invalid signature"
        );
        require(verifier.verifyProof(_proof, [uint256(_root), uint256(_nullifierHash), uint256(_chatKey)]), "Invalid withdraw proof");

        nullifierHashes[_nullifierHash] = true;
        if (_fee > 0) {
            require(token.transfer(_relayer, _fee), "Error in transfer.");
        }
        _safeRegister(_chatKey, _data);
        emit Spend(_chatKey, _nullifierHash, _relayer, _fee);
    }

    /**
     * @dev Deposit funds into the contract.
     * @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
    */
    function deposit(bytes32 _commitment) public nonReentrant {
        require(!commitments[_commitment], "The commitment has been submitted");

        uint32 insertedIndex = _insert(_commitment);
        commitments[_commitment] = true;
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                price
            ),
            "Transfer failed"
        );
        reserveAmount += price;

        emit Deposit(_commitment, insertedIndex, block.timestamp);
    }

    /**
     * @notice Support for "approveAndCall". Callable only by `token()`.  
     * @param _from Who approved.
     * @param _amount Amount being approved, need to be equal `getPrice()`.
     * @param _token Token being approved, need to be equal `token()`.
     * @param _data Abi encoded data with selector of `deposit(bytes32)` or `register(bytes32,address,bytes32,bytes32)`.
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
        if(_data.length <= 132) {
            return super.receiveApproval(_from, _amount, _token, _data);
        } else {
            bytes32 commitment;
            (sig, commitment) = abiDecodeRegister(_data);
            require(
                sig == bytes4(keccak256("deposit(bytes32)")),
                "Wrong method selector"
            );
            deposit(commitment);
        }

    }

    function isSpent(bytes32 _nullifierHash) public view returns(bool) {
        return nullifierHashes[_nullifierHash];
    }

    function isSpentArray(bytes32[] calldata _nullifierHashes) external view returns(bool[] memory spent) {
        spent = new bool[](_nullifierHashes.length);
        for(uint i = 0; i < _nullifierHashes.length; i++) {
            if (isSpent(_nullifierHashes[i])) {
                spent[i] = true;
            }
        }
    }

    function updateVerifier(address _newVerifier) external onlyController {
        verifier = IVerifier(_newVerifier);
    }

    function _safeRegister(address payable _owner, bytes memory _data) private {
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
        require(state == RegistrarState.Active, "Registry not active.");
        namehash = keccak256(abi.encodePacked(ensNode, _label));
        require(ensRegistry.owner(namehash) == address(0), "ENS node already owned.");
        require(accounts[_label].creationTime == 0, "Username already registered.");
        accounts[_label] = Account(price, block.timestamp, _owner);
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
}
