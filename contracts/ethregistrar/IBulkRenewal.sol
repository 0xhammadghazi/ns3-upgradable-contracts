interface IBulkRenewal {

    function renewAll(
        string[] calldata names,
        uint256 duration
    ) external;
}
