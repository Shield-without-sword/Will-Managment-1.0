// frontend/js/web3.js

const getEthereumObject = () => {
    const { ethereum } = window;
    if (!ethereum) {
        alert("Please install MetaMask!");
        return null;
    }
    return ethereum;
};

const connectWallet = async () => {
    try {
        const ethereum = getEthereumObject();
        if (!ethereum) return null;

        const accounts = await ethereum.request({
            method: "eth_requestAccounts",
        });

        if (accounts.length !== 0) {
            return accounts[0];
        } else {
            console.log("No accounts found");
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getBalance = async (address) => {
    try {
        const ethereum = getEthereumObject();
        if (!ethereum) return null;

        const balance = await ethereum.request({
            method: "eth_getBalance",
            params: [address, "latest"]
        });
        
        return parseInt(balance, 16) / Math.pow(10, 18); // Convert from Wei to ETH
    } catch (error) {
        console.log(error);
        return null;
    }
};

const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export { connectWallet, getBalance, shortenAddress };