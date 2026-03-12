// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeTicketSystem
 * @dev 去中心化售票與簽到系統智慧合約
 */
contract DeTicketSystem is ReentrancyGuard {
    // 合約建立者地址
    address public immutable contractOwner;

    // Chainlink Price Feed for ETH/USD on Sepolia
    AggregatorV3Interface internal priceFeed;

    // 活動資訊結構
    struct EventInfo {
        address organizer; // 主辦者地址
        uint256 ticketsSold; // 已售票券數量
        uint256 maxTicketSupply; // 票券最大供應量
        uint256 ticketPriceUSD; // 票券價格(美元，單位: cents)
        bool exists; // 活動是否存在
    }

    // 活動識別碼 => 活動資訊
    mapping(bytes32 => EventInfo) public events;

    // 活動識別碼 => IPFS CID
    mapping(bytes32 => string) public eventCID;

    // 付款識別碼 => 活動識別碼
    mapping(bytes32 => bytes32) public ticketEventId;

    // 付款識別碼 => 使用時間戳 (0表示未使用)
    mapping(bytes32 => uint256) public ticketUsageTimestamp;

    // 付款識別碼 => 購買者地址
    mapping(bytes32 => address) public ticketOwner;

    // 事件
    event EventCreated(
        bytes32 indexed eventId,
        string cid,
        bytes32 contentHash,
        address indexed organizer,
        uint256 maxTicketSupply,
        uint256 ticketPriceUSD
    );

    event TicketPurchased(
        bytes32 indexed paymentId,
        bytes32 indexed eventId,
        address indexed buyer,
        uint256 amountPaid
    );

    event TicketVerified(bytes32 indexed paymentId, uint256 timestamp);

    /**
     * @dev 建構函數
     * @param _priceFeed Chainlink Price Feed 地址 (Sepolia ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306)
     */
    constructor(address _priceFeed) {
        contractOwner = msg.sender;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @dev 函數A: 建立活動
     * @param cid IPFS CID
     * @param contentHash 活動資料的 hash
     * @param organizer 主辦者地址
     * @param maxTicketSupply 票券最大供應量
     * @param ticketPriceUSD 票券價格(美元 cents，例如: 10000 = $100.00)
     * @return eventId 活動識別碼
     */
    function createEvent(
        string memory cid,
        bytes32 contentHash,
        address organizer,
        uint256 maxTicketSupply,
        uint256 ticketPriceUSD
    ) external returns (bytes32 eventId) {
        require(organizer != address(0), "Invalid organizer address");
        require(maxTicketSupply > 0, "Max supply must be greater than 0");
        require(ticketPriceUSD > 0, "Ticket price must be greater than 0");

        // 計算活動識別碼: hash(CID, contentHash, organizer)
        eventId = keccak256(abi.encodePacked(cid, contentHash, organizer));

        // 檢查活動是否已存在
        require(!events[eventId].exists, "Event already exists");

        // 儲存活動資訊
        events[eventId] = EventInfo({
            organizer: organizer,
            ticketsSold: 0,
            maxTicketSupply: maxTicketSupply,
            ticketPriceUSD: ticketPriceUSD,
            exists: true
        });

        // 儲存活動的 CID
        eventCID[eventId] = cid;

        emit EventCreated(
            eventId,
            cid,
            contentHash,
            organizer,
            maxTicketSupply,
            ticketPriceUSD
        );

        return eventId;
    }

    /**
     * @dev 函數B: 購買票券
     * @param eventId 活動識別碼
     * @param nonce 票券ID (隨機nonce)
     * @return paymentId 付款識別碼
     */
    function purchaseTicket(
        bytes32 eventId,
        uint256 nonce
    ) external payable nonReentrant returns (bytes32 paymentId) {
        // 檢查活動是否存在
        require(events[eventId].exists, "Event does not exist");

        EventInfo storage eventInfo = events[eventId];

        // 檢查票券是否售罄
        require(
            eventInfo.ticketsSold < eventInfo.maxTicketSupply,
            "Tickets sold out"
        );

        // 計算付款識別碼: hash(eventId, nonce, buyer)
        paymentId = keccak256(abi.encodePacked(eventId, nonce, msg.sender));

        // 檢查付款識別碼是否已被使用
        require(
            ticketUsageTimestamp[paymentId] == 0,
            "Payment ID already exists"
        );

        // 取得當前 ETH 價格並計算所需 ETH 金額
        uint256 requiredETH = calculateRequiredETH(eventInfo.ticketPriceUSD);
        require(msg.value >= requiredETH, "Insufficient payment");

        // 增加已售票券數量
        eventInfo.ticketsSold += 1;

        // 初始化付款識別碼的時間戳為0 (未使用)
        ticketUsageTimestamp[paymentId] = 0;

        // 記錄票券擁有者
        ticketOwner[paymentId] = msg.sender;

        // 記錄票券所屬的活動
        ticketEventId[paymentId] = eventId;

        // 計算分帳金額
        uint256 ownerShare = (requiredETH * 25) / 100; // 25% 給合約建立者
        uint256 organizerShare = requiredETH - ownerShare; // 75% 給主辦者

        // 執行分帳
        (bool ownerSuccess, ) = contractOwner.call{value: ownerShare}("");
        require(ownerSuccess, "Transfer to contract owner failed");

        (bool organizerSuccess, ) = eventInfo.organizer.call{
            value: organizerShare
        }("");
        require(organizerSuccess, "Transfer to organizer failed");

        emit TicketPurchased(paymentId, eventId, msg.sender, requiredETH);

        // 退還多餘的款項
        if (msg.value > requiredETH) {
            (bool refundSuccess, ) = msg.sender.call{
                value: msg.value - requiredETH
            }("");
            require(refundSuccess, "Refund failed");
        }

        return paymentId;
    }

    /**
     * @dev 函數C: 驗票
     * @param paymentId 付款識別碼
     * @return success 驗票是否成功
     */
    function verifyTicket(bytes32 paymentId) external returns (bool success) {
        // 檢查調用者是否為票券擁有者
        require(
            ticketOwner[paymentId] == msg.sender,
            "Only ticket owner can verify"
        );

        // 檢查付款識別碼的時間戳
        uint256 timestamp = ticketUsageTimestamp[paymentId];

        require(timestamp == 0, "Ticket already used");

        // 如果時間戳為0，表示未使用
        // 更新為當前時間
        ticketUsageTimestamp[paymentId] = block.timestamp;
        emit TicketVerified(paymentId, block.timestamp);
        return true;
    }

    /**
     * @dev 取得最新的 ETH/USD 價格
     * @return price ETH價格 (單位: USD, 8位小數)
     */
    function getLatestETHPrice() public view returns (int256 price) {
        (
            ,
            /* uint80 roundID */ int256 answer,
            ,
            ,

        ) = /* uint256 startedAt */ /* uint256 updatedAt */ /* uint80 answeredInRound */ priceFeed
                .latestRoundData();

        return answer; // 價格有8位小數，例如: 200000000000 = $2000.00
    }

    /**
     * @dev 計算購買票券所需的 ETH 金額
     * @param ticketPriceUSD 票券價格(美元 cents)
     * @return requiredETH 所需 ETH 數量 (wei)
     */
    function calculateRequiredETH(
        uint256 ticketPriceUSD
    ) public view returns (uint256 requiredETH) {
        int256 ethPriceUSD = getLatestETHPrice(); // 8位小數
        require(ethPriceUSD > 0, "Invalid ETH price");

        // ticketPriceUSD 單位是 cents (需要除以100變成USD)
        // ethPriceUSD 單位是 8位小數 (需要除以10^8變成USD)
        // 需要轉換為 wei (18位小數)

        // 公式推導:
        // requiredETH (wei) = (ticketPriceUSD_cents / 100) / (ethPriceUSD_8decimals / 10^8) * 10^18
        //                   = ticketPriceUSD_cents * 10^8 * 10^18 / (ethPriceUSD_8decimals * 100)
        //                   = ticketPriceUSD_cents * 10^24 / ethPriceUSD_8decimals

        requiredETH = (ticketPriceUSD * 1e24) / uint256(ethPriceUSD);

        return requiredETH;
    }

    /**
     * @dev 查詢活動資訊
     * @param eventId 活動識別碼
     */
    function getEventInfo(
        bytes32 eventId
    )
        external
        view
        returns (
            address organizer,
            uint256 ticketsSold,
            uint256 maxTicketSupply,
            uint256 ticketPriceUSD,
            bool exists
        )
    {
        EventInfo memory eventInfo = events[eventId];
        return (
            eventInfo.organizer,
            eventInfo.ticketsSold,
            eventInfo.maxTicketSupply,
            eventInfo.ticketPriceUSD,
            eventInfo.exists
        );
    }

    /**
     * @dev 查詢票券使用狀態
     * @param paymentId 付款識別碼
     */
    function getTicketUsageStatus(
        bytes32 paymentId
    ) external view returns (bool isUsed, uint256 usedTimestamp) {
        uint256 timestamp = ticketUsageTimestamp[paymentId];
        return (timestamp > 0, timestamp);
    }

    /**
     * @dev 查詢票券對應的活動資訊
     * @param paymentId 付款識別碼
     * @return eventId 活動識別碼
     * @return cid IPFS CID
     * @return exists 票券是否存在
     */
    function getTicketEventInfo(
        bytes32 paymentId
    ) external view returns (bytes32 eventId, string memory cid, bool exists) {
        eventId = ticketEventId[paymentId];
        if (eventId != bytes32(0)) {
            cid = eventCID[eventId];
            exists = true;
        } else {
            cid = "";
            exists = false;
        }
        return (eventId, cid, exists);
    }
}
