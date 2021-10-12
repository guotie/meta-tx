// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// import "hardhat/console.sol";

/**
 * @dev forwarder to be used together with an ERC2771 compatible contract. See {ERC2771Context}.
 */
contract Forwarder is Initializable,
                    UUPSUpgradeable,
                    ReentrancyGuardUpgradeable,
                    EIP712Upgradeable,
                    OwnableUpgradeable {
    using ECDSAUpgradeable for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        // uint256 gas;
        uint256 nonce;
        bytes data;
    }

    bytes32 public constant _TYPE_HASH =
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 nonce,bytes data)");

    mapping(address => uint256) private _nonces;


    function initialize() public payable initializer {
        // "constructor" code...
        // console.log("market msg.sender: %s", msg.sender);
        __ReentrancyGuard_init();
        __Ownable_init();
        __EIP712_init("Forwarder", "1.0");
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        newImplementation;
        require(msg.sender == owner(), "no auth");
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    /// @notice Returns a hash of the given data, prepared using EIP712 typed data hashing rules.
    /// @param from origin sender
    /// @param to contract to call
    /// @param value send ETH value
    /// @param nonce from's nonce
    /// @param data encodewithselector contract call params
    /// @return digest hash digest
    function getDigest(
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        bytes memory data
        ) public view returns (bytes32 digest) {

        digest = _hashTypedDataV4(
            keccak256(abi.encode(_TYPE_HASH, from, to, value, nonce, keccak256(data))));

    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        bytes32 digest = getDigest(req.from, req.to, req.value, req.nonce, req.data);
        // console.logBytes32(digest);
        address signer = digest.recover(signature);

        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    function execute(ForwardRequest calldata req, bytes calldata signature)
        public
        payable
        nonReentrant
        returns (bool, bytes memory)
    {
        require(verify(req, signature), "Forwarder: signature does not match request");
        _nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{value: req.value}(
            abi.encodePacked(req.data, req.from)
        );
        // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.link/blog/ethereum-gas-dangers/
        // assert(gasleft() > req.gas / 63);
        require(success, "failed");
        return (success, returndata);
    }
}
