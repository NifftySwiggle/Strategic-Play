// NFT Utility Functions for Strategic Play
class NFTLoader {
    constructor(contractAddress) {
        this.contractAddress = contractAddress;
        this.apis = [
            {
                name: 'OpenSea',
                url: `https://api.opensea.io/api/v1/assets?asset_contract_address=${contractAddress}&limit=4`,
                parser: this.parseOpenSeaResponse.bind(this)
            },
            {
                name: 'Reservoir',
                url: `https://api.reservoir.tools/tokens/v5?contract=${contractAddress}&limit=4`,
                parser: this.parseReservoirResponse.bind(this),
                headers: {
                    'Accept': 'application/json'
                }
            }
        ];
    }

    async loadNFTs() {
        // Always try to load NFTs from public APIs (no wallet required)
        for (const api of this.apis) {
            try {
                console.log(`Trying ${api.name} API...`);
                const response = await fetch(api.url, {
                    headers: api.headers || {},
                    mode: 'cors'
                });

                if (response.ok) {
                    const data = await response.json();
                    const nfts = api.parser(data);
                    if (nfts && nfts.length > 0) {
                        console.log(`Successfully loaded ${nfts.length} NFTs from ${api.name}`);
                        return nfts;
                    }
                }
            } catch (error) {
                console.log(`${api.name} API failed:`, error);
                continue;
            }
        }

        // If all APIs fail, show contract-based placeholder NFTs
        return await this.getContractBasedNFTs();
    }

    parseOpenSeaResponse(data) {
        if (!data.assets || !Array.isArray(data.assets)) return [];
        
        return data.assets.map(asset => ({
            id: asset.token_id || 'Unknown',
            name: asset.name || `Pitbit #${asset.token_id}`,
            description: asset.description || 'Strategic Play Pitbit NFT',
            image: this.getImageUrl(asset),
            traits: asset.traits || [],
            collection: asset.collection?.name || 'Strategic Play Pitbits'
        }));
    }

    parseReservoirResponse(data) {
        if (!data.tokens || !Array.isArray(data.tokens)) return [];
        
        return data.tokens.map(token => {
            const nft = token.token;
            return {
                id: nft.tokenId || 'Unknown',
                name: nft.name || `Pitbit #${nft.tokenId}`,
                description: nft.description || 'Strategic Play Pitbit NFT',
                image: this.getImageUrl(nft),
                traits: nft.attributes || [],
                collection: nft.collection?.name || 'Strategic Play Pitbits'
            };
        });
    }

    getImageUrl(asset) {
        // Try multiple possible image fields
        const possibleImages = [
            asset.image_url,
            asset.image_preview_url,
            asset.image_thumbnail_url,
            asset.image,
            asset.animation_url,
            asset.media?.[0]?.gateway,
            asset.media?.[0]?.raw
        ];

        for (const img of possibleImages) {
            if (img && img.trim()) {
                // Convert IPFS URLs to HTTP gateways
                if (img.startsWith('ipfs://')) {
                    return `https://ipfs.io/ipfs/${img.slice(7)}`;
                }
                return img;
            }
        }

        return null;
    }

    async getContractBasedNFTs() {
        // Create themed NFTs based on the contract address
        const contractShort = this.contractAddress.slice(-4);
        
        return [
            {
                id: "001",
                name: `Strategic Knight #${contractShort}`,
                description: `Tactical movement specialist from the Strategic Play collection`,
                image: "./assets/pitbits/strategic-element-1.svg",
                traits: [
                    { trait_type: "Type", value: "Knight" },
                    { trait_type: "Rarity", value: "Rare" },
                    { trait_type: "Power", value: "85" }
                ],
                collection: "Strategic Play Pitbits"
            },
            {
                id: "002", 
                name: `Tactical Bishop #${contractShort}`,
                description: `Diagonal dominance piece from the Strategic Play collection`,
                image: "./assets/pitbits/strategic-element-2.svg",
                traits: [
                    { trait_type: "Type", value: "Bishop" },
                    { trait_type: "Rarity", value: "Epic" },
                    { trait_type: "Power", value: "75" }
                ],
                collection: "Strategic Play Pitbits"
            },
            {
                id: "003",
                name: `Endgame Queen #${contractShort}`,
                description: `Ultimate power piece from the Strategic Play collection`,
                image: "./assets/pitbits/strategic-element-3.svg",
                traits: [
                    { trait_type: "Type", value: "Queen" },
                    { trait_type: "Rarity", value: "Legendary" },
                    { trait_type: "Power", value: "95" }
                ],
                collection: "Strategic Play Pitbits"
            },
            {
                id: "004",
                name: `Royal King #${contractShort}`,
                description: `Crown jewel from the Strategic Play collection`,
                image: "./assets/pitbits/strategic-element-4.svg",
                traits: [
                    { trait_type: "Type", value: "King" },
                    { trait_type: "Rarity", value: "Mythic" },
                    { trait_type: "Power", value: "100" }
                ],
                collection: "Strategic Play Pitbits"
            }
        ];
    }
}

// Export for use in main script
window.NFTLoader = NFTLoader;