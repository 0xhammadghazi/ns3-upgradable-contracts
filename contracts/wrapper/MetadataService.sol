//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MetadataService is Ownable {
    string private _uri;
    mapping(uint256 => string) uris;

    event MetadataUpdate(uint256 _tokenId, string __uri);

    constructor(string memory _metaDataUri) {
        _uri = _metaDataUri;
    }

    function uri(uint256 tokenId) public view returns (string memory) {
        string memory _tokenURI = uris[tokenId];
        string memory base = _uri;

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via string.concat).
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        return _uri;
    }

    function setUri(uint256 tokenId, string calldata __uri) public onlyOwner {
        uris[tokenId] = __uri;
        emit MetadataUpdate(tokenId, __uri);
    }
}
