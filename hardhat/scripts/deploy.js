const hre = require("hardhat");

async function main() {
    console.log("開始部署 DeTicketSystem 合約...");

    // Chainlink Price Feed 地址
    // Sepolia ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306
    const SEPOLIA_ETH_USD_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

    // 取得部署者地址
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(balance), "ETH");

    // 部署合約
    const DeTicketSystem = await hre.ethers.getContractFactory("DeTicketSystem");
    const deTicketSystem = await DeTicketSystem.deploy(SEPOLIA_ETH_USD_PRICE_FEED);

    await deTicketSystem.waitForDeployment();

    const contractAddress = await deTicketSystem.getAddress();
    console.log("DeTicketSystem 合約部署成功！");
    console.log("合約地址:", contractAddress);
    console.log("合約建立者:", await deTicketSystem.contractOwner());

    // 驗證 Chainlink Price Feed 連接
    try {
        const ethPrice = await deTicketSystem.getLatestETHPrice();
        console.log("當前 ETH 價格:", Number(ethPrice) / 1e8, "USD");
    } catch (error) {
        console.log("警告: 無法取得 ETH 價格，請確認 Chainlink Price Feed 設定正確");
    }

    console.log("\n部署資訊摘要:");
    console.log("=====================================");
    console.log("網路:", hre.network.name);
    console.log("合約地址:", contractAddress);
    console.log("建立者:", deployer.address);
    console.log("Price Feed:", SEPOLIA_ETH_USD_PRICE_FEED);
    console.log("=====================================");

    // 等待幾個區塊確認後再進行驗證
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\n等待區塊確認以進行合約驗證...");
        await deTicketSystem.deploymentTransaction().wait(6);

        console.log("開始驗證合約...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [SEPOLIA_ETH_USD_PRICE_FEED],
            });
            console.log("合約驗證成功！");
        } catch (error) {
            console.log("合約驗證失敗:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
