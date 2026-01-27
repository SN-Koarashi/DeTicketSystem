const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeTicketSystem", function () {
    let deTicketSystem;
    let owner, organizer, buyer1, buyer2;
    let mockPriceFeed;

    // 測試數據
    const TEST_CID = "QmTest123456789";
    const TEST_CONTENT_HASH = ethers.keccak256(ethers.toUtf8Bytes("test content"));
    const MAX_TICKET_SUPPLY = 100;
    const TICKET_PRICE_USD = 10000; // $100.00 (in cents)

    beforeEach(async function () {
        [owner, organizer, buyer1, buyer2] = await ethers.getSigners();

        // 部署 Mock Price Feed (用於測試)
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3Aggregator.deploy(
            8, // decimals
            200000000000 // initial answer: $2000.00
        );
        await mockPriceFeed.waitForDeployment();

        // 部署 DeTicketSystem 合約
        const DeTicketSystem = await ethers.getContractFactory("DeTicketSystem");
        deTicketSystem = await DeTicketSystem.deploy(await mockPriceFeed.getAddress());
        await deTicketSystem.waitForDeployment();
    });

    describe("部署測試", function () {
        it("應該正確設定合約建立者", async function () {
            expect(await deTicketSystem.contractOwner()).to.equal(owner.address);
        });

        it("應該能取得 ETH 價格", async function () {
            const price = await deTicketSystem.getLatestETHPrice();
            expect(price).to.equal(200000000000n); // $2000.00
        });
    });

    describe("函數A: 建立活動", function () {
        it("應該成功建立活動", async function () {
            const tx = await deTicketSystem.createEvent(
                TEST_CID,
                TEST_CONTENT_HASH,
                organizer.address,
                MAX_TICKET_SUPPLY,
                TICKET_PRICE_USD
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return deTicketSystem.interface.parseLog(log)?.name === "EventCreated";
                } catch {
                    return false;
                }
            });

            expect(event).to.not.be.undefined;

            // 計算預期的活動識別碼
            const expectedEventId = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32", "address"],
                    [TEST_CID, TEST_CONTENT_HASH, organizer.address]
                )
            );

            // 驗證活動資訊
            const eventInfo = await deTicketSystem.getEventInfo(expectedEventId);
            expect(eventInfo.organizer).to.equal(organizer.address);
            expect(eventInfo.ticketsSold).to.equal(0);
            expect(eventInfo.maxTicketSupply).to.equal(MAX_TICKET_SUPPLY);
            expect(eventInfo.ticketPriceUSD).to.equal(TICKET_PRICE_USD);
            expect(eventInfo.exists).to.be.true;
        });

        it("不應該允許建立重複的活動", async function () {
            await deTicketSystem.createEvent(
                TEST_CID,
                TEST_CONTENT_HASH,
                organizer.address,
                MAX_TICKET_SUPPLY,
                TICKET_PRICE_USD
            );

            await expect(
                deTicketSystem.createEvent(
                    TEST_CID,
                    TEST_CONTENT_HASH,
                    organizer.address,
                    MAX_TICKET_SUPPLY,
                    TICKET_PRICE_USD
                )
            ).to.be.revertedWith("Event already exists");
        });

        it("不應該允許無效的主辦者地址", async function () {
            await expect(
                deTicketSystem.createEvent(
                    TEST_CID,
                    TEST_CONTENT_HASH,
                    ethers.ZeroAddress,
                    MAX_TICKET_SUPPLY,
                    TICKET_PRICE_USD
                )
            ).to.be.revertedWith("Invalid organizer address");
        });
    });

    describe("函數B: 購買票券", function () {
        let eventId;

        beforeEach(async function () {
            // 建立活動
            await deTicketSystem.createEvent(
                TEST_CID,
                TEST_CONTENT_HASH,
                organizer.address,
                MAX_TICKET_SUPPLY,
                TICKET_PRICE_USD
            );

            eventId = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32", "address"],
                    [TEST_CID, TEST_CONTENT_HASH, organizer.address]
                )
            );
        });

        it("應該成功購買票券並正確分帳", async function () {
            const nonce = 12345;
            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const organizerBalanceBefore = await ethers.provider.getBalance(organizer.address);

            const tx = await deTicketSystem.connect(buyer1).purchaseTicket(
                eventId,
                nonce,
                { value: requiredETH }
            );

            await tx.wait();

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            const organizerBalanceAfter = await ethers.provider.getBalance(organizer.address);

            // 驗證分帳: 25% 給 owner, 75% 給 organizer
            const expectedOwnerShare = (requiredETH * 25n) / 100n;
            const expectedOrganizerShare = requiredETH - expectedOwnerShare;

            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedOwnerShare);
            expect(organizerBalanceAfter - organizerBalanceBefore).to.equal(expectedOrganizerShare);

            // 驗證票券數量增加
            const eventInfo = await deTicketSystem.getEventInfo(eventId);
            expect(eventInfo.ticketsSold).to.equal(1);
        });

        it("應該在票券售罄時拒絕購買", async function () {
            // 建立只有1張票的活動
            const smallEventCID = "QmSmallEvent";
            await deTicketSystem.createEvent(
                smallEventCID,
                TEST_CONTENT_HASH,
                organizer.address,
                1, // 只有1張票
                TICKET_PRICE_USD
            );

            const smallEventId = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32", "address"],
                    [smallEventCID, TEST_CONTENT_HASH, organizer.address]
                )
            );

            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);

            // 第一次購買應該成功
            await deTicketSystem.connect(buyer1).purchaseTicket(
                smallEventId,
                12345,
                { value: requiredETH }
            );

            // 第二次購買應該失敗
            await expect(
                deTicketSystem.connect(buyer2).purchaseTicket(
                    smallEventId,
                    67890,
                    { value: requiredETH }
                )
            ).to.be.revertedWith("Tickets sold out");
        });

        it("應該在付款不足時拒絕購買", async function () {
            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);
            const insufficientPayment = requiredETH / 2n;

            await expect(
                deTicketSystem.connect(buyer1).purchaseTicket(
                    eventId,
                    12345,
                    { value: insufficientPayment }
                )
            ).to.be.revertedWith("Insufficient payment");
        });
    });

    describe("函數C: 驗票", function () {
        let eventId, paymentId;

        beforeEach(async function () {
            // 建立活動
            await deTicketSystem.createEvent(
                TEST_CID,
                TEST_CONTENT_HASH,
                organizer.address,
                MAX_TICKET_SUPPLY,
                TICKET_PRICE_USD
            );

            eventId = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32", "address"],
                    [TEST_CID, TEST_CONTENT_HASH, organizer.address]
                )
            );

            // 購買票券
            const nonce = 12345;
            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);

            const tx = await deTicketSystem.connect(buyer1).purchaseTicket(
                eventId,
                nonce,
                { value: requiredETH }
            );

            const receipt = await tx.wait();
            const purchaseEvent = receipt.logs.find(log => {
                try {
                    const parsed = deTicketSystem.interface.parseLog(log);
                    return parsed?.name === "TicketPurchased";
                } catch {
                    return false;
                }
            });

            paymentId = deTicketSystem.interface.parseLog(purchaseEvent).args.paymentId;
        });

        it("第一次驗票應該成功", async function () {
            const result = await deTicketSystem.verifyTicket.staticCall(paymentId);
            expect(result).to.be.true;

            // 執行驗票
            await deTicketSystem.verifyTicket(paymentId);

            // 驗證狀態已更新
            const status = await deTicketSystem.getTicketUsageStatus(paymentId);
            expect(status.isUsed).to.be.true;
            expect(status.usedTimestamp).to.be.gt(0);
        });

        it("第二次驗票應該失敗", async function () {
            // 第一次驗票
            await deTicketSystem.verifyTicket(paymentId);

            // 第二次驗票應該返回 false
            const result = await deTicketSystem.verifyTicket.staticCall(paymentId);
            expect(result).to.be.false;
        });
    });

    describe("價格計算", function () {
        it("應該正確計算所需的 ETH 金額", async function () {
            // ETH 價格: $2000
            // 票券價格: $100
            // 應需要: 100 / 2000 = 0.05 ETH
            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);
            const expectedETH = ethers.parseEther("0.05");

            expect(requiredETH).to.equal(expectedETH);
        });

        it("應該在 ETH 價格變動時正確計算", async function () {
            // 更新 ETH 價格為 $3000
            await mockPriceFeed.updateAnswer(300000000000n);

            // 票券價格: $100
            // 應需要: 100 / 3000 ≈ 0.0333... ETH
            const requiredETH = await deTicketSystem.calculateRequiredETH(TICKET_PRICE_USD);
            const expectedETH = ethers.parseEther("100") / 3000n;

            expect(requiredETH).to.be.closeTo(expectedETH, ethers.parseEther("0.0001"));
        });
    });
});
