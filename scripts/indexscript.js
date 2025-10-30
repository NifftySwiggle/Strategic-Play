// GSAP and ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Parallax for Hero, Origins, and Roadmap
gsap.utils.toArray(".parallax").forEach((section) => {
    const bg = section.querySelector(".parallax-bg");
    if (bg) {
        gsap.to(bg, {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                scrub: true,
            },
        });
    }
});

// Professional Section Scroll Animations with Reverse Effects
gsap.utils.toArray(".section").forEach((section) => {
    const title = section.querySelector("h2");
    const content = section.querySelector("p, .nft-gallery, .pass-container, .origins-gallery, .mint-collections");
    
    // Title animation with reverse
    if (title) {
        gsap.fromTo(title, 
            {
                y: 60,
                opacity: 0,
                scale: 0.9
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: title,
                    start: "top 85%",
                    end: "top 15%",
                    toggleActions: "play reverse play reverse",
                    onEnter: () => gsap.to(title, { rotationX: 0, duration: 0.8 }),
                    onLeave: () => gsap.to(title, { rotationX: -10, duration: 0.5 }),
                    onEnterBack: () => gsap.to(title, { rotationX: 0, duration: 0.8 }),
                    onLeaveBack: () => gsap.to(title, { rotationX: 10, duration: 0.5 })
                }
            }
        );
    }

    // Content animation with reverse
    if (content) {
        gsap.fromTo(content,
            {
                y: 40,
                opacity: 0,
                scale: 0.95
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                delay: 0.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: content,
                    start: "top 85%",
                    end: "top 15%",
                    toggleActions: "play reverse play reverse"
                }
            }
        );
    }
});

// Enhanced NFT Card Animations with Reverse
gsap.utils.toArray(".nft-card").forEach((card, i) => {
    gsap.fromTo(card,
        {
            scale: 0.7,
            y: 80,
            opacity: 0,
            rotationY: i % 2 === 0 ? -15 : 15
        },
        {
            scale: 1,
            y: 0,
            opacity: 1,
            rotationY: 0,
            duration: 1,
            delay: i * 0.15,
            ease: "back.out(1.4)",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 15%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        boxShadow: "0 10px 30px rgba(255, 215, 0, 0.2)",
                        duration: 0.5 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                        duration: 0.3 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        boxShadow: "0 10px 30px rgba(255, 215, 0, 0.2)",
                        duration: 0.5 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        boxShadow: "none",
                        duration: 0.3 
                    });
                }
            }
        }
    );
});

// Pass Cards Animation with Reverse Effects
gsap.utils.toArray(".pass-card").forEach((card, i) => {
    gsap.fromTo(card,
        {
            x: i % 2 === 0 ? -100 : 100,
            y: 60,
            opacity: 0,
            rotation: i % 2 === 0 ? -8 : 8,
            scale: 0.8
        },
        {
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0,
            scale: 1,
            duration: 1.2,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 15%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        duration: 0.6 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.1)",
                        duration: 0.4 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        duration: 0.6 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        borderColor: "transparent",
                        duration: 0.4 
                    });
                }
            }
        }
    );
});

// Origins Cards Animation with Advanced Reverse Effects
gsap.utils.toArray(".origins-image-card").forEach((card, i) => {
    gsap.fromTo(card,
        {
            scale: 0.6,
            y: 80,
            opacity: 0,
            rotationX: -20,
            transformOrigin: "center bottom"
        },
        {
            scale: 1,
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: 1.4,
            delay: i * 0.08,
            ease: "elastic.out(1, 0.6)",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 15%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(20px)",
                        background: "rgba(42, 42, 42, 0.98)",
                        duration: 0.8 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(10px)",
                        background: "rgba(42, 42, 42, 0.8)",
                        duration: 0.5 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(20px)",
                        background: "rgba(42, 42, 42, 0.98)",
                        duration: 0.8 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(5px)",
                        background: "rgba(42, 42, 42, 0.7)",
                        duration: 0.5 
                    });
                }
            }
        }
    );
});

// Mint Collection Cards Animation with Reverse Effects
gsap.utils.toArray(".mint-collection-card").forEach((card, i) => {
    gsap.fromTo(card,
        {
            y: 120,
            opacity: 0,
            scale: 0.8,
            rotationY: i % 2 === 0 ? -10 : 10
        },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            rotationY: 0,
            duration: 1.2,
            delay: i * 0.2,
            ease: "power4.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 15%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.4)",
                        boxShadow: "0 10px 25px rgba(255, 215, 0, 0.1)",
                        duration: 0.8 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.1)",
                        boxShadow: "none",
                        duration: 0.5 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 215, 0, 0.4)",
                        boxShadow: "0 10px 25px rgba(255, 215, 0, 0.1)",
                        duration: 0.8 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        borderColor: "transparent",
                        boxShadow: "none",
                        duration: 0.5 
                    });
                }
            }
        }
    );
});

// Statistics Animation with Reverse Effects
gsap.utils.toArray(".stat-item").forEach((stat, i) => {
    gsap.fromTo(stat,
        {
            scale: 0.5,
            opacity: 0,
            rotationY: i % 2 === 0 ? -20 : 20
        },
        {
            scale: 1,
            opacity: 1,
            rotationY: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: stat,
                start: "top 85%",
                end: "top 15%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(stat, { 
                        backgroundColor: "rgba(255, 215, 0, 0.05)",
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        boxShadow: "0 5px 15px rgba(255, 215, 0, 0.1)",
                        duration: 0.6 
                    });
                },
                onLeave: () => {
                    gsap.to(stat, { 
                        backgroundColor: "transparent",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        boxShadow: "none",
                        duration: 0.4 
                    });
                },
                onEnterBack: () => {
                    gsap.to(stat, { 
                        backgroundColor: "rgba(255, 215, 0, 0.05)",
                        borderColor: "rgba(255, 215, 0, 0.3)",
                        boxShadow: "0 5px 15px rgba(255, 215, 0, 0.1)",
                        duration: 0.6 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(stat, { 
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        boxShadow: "none",
                        duration: 0.4 
                    });
                }
            }
        }
    );

    // Animate the numbers
    const numberElement = stat.querySelector("span");
    if (numberElement && !isNaN(numberElement.textContent)) {
        const finalNumber = parseInt(numberElement.textContent);
        gsap.from({ value: 0 }, {
            value: finalNumber,
            duration: 2,
            delay: i * 0.1 + 0.5,
            ease: "power2.out",
            onUpdate: function() {
                numberElement.textContent = Math.round(this.targets()[0].value);
            },
            scrollTrigger: {
                trigger: stat,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    }
});

// Hero Section Animation
gsap.timeline()
    .from(".hero-content h1", {
        y: 80,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out"
    })
    .from(".hero-content p", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
    }, "-=0.8")
    .from(".cta-btn", {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.5");

// Footer Animation
gsap.from("footer", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
        trigger: "footer",
        start: "top 90%",
        toggleActions: "play none none reverse"
    }
});

// Sliding Pitbits and Pixel Art Cards
gsap.utils.toArray(".pitbit-card, .pixel-art-card").forEach((card, i) => {
    gsap.from(card, {
        x: i % 2 === 0 ? -100 : 100,
        opacity: 0,
        duration: 1,
        delay: i * 0.1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 15%",
            toggleActions: "play none none reverse"
        }
    });
});

// 3D NFT Preview (Three.js)
function initNFTPreview() {
    const previews = document.querySelectorAll(".nft-preview");
    previews.forEach((preview) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, preview.clientWidth / preview.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(preview.clientWidth, preview.clientHeight);
        preview.appendChild(renderer.domElement);

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 5;

        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();

        // Resize Handling
        window.addEventListener("resize", () => {
            renderer.setSize(preview.clientWidth, preview.clientHeight);
            camera.aspect = preview.clientWidth / preview.clientHeight;
            camera.updateProjectionMatrix();
        });

        // Hover Interaction
        preview.addEventListener("mouseenter", () => {
            gsap.to(cube.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.3 });
        });
        preview.addEventListener("mouseleave", () => {
            gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        });
    });
}
initNFTPreview();

// Mobile Menu Toggle
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

// Dropdown Animations
gsap.utils.toArray(".dropdown").forEach((dropdown) => {
    const menu = dropdown.querySelector(".dropdown-menu");
    gsap.from(menu.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        paused: true,
    });

    // Desktop: Hover to show dropdown
    dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth > 768) {
            gsap.to(menu.children, {
                y: 0,
                opacity: 1,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out",
            });
        }
    });

    dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth > 768) {
            gsap.to(menu.children, {
                y: 20,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
            });
        }
    });

    // Mobile: Tap to toggle dropdown
    dropdown.querySelector(".dropdown-toggle").addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropdown.classList.toggle("active");
            if (dropdown.classList.contains("active")) {
                gsap.to(menu.children, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out",
                });
            } else {
                gsap.to(menu.children, {
                    y: 20,
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in",
                });
            }
        }
    });
});

// Countdown Timer
function startCountdown() {
    const timer = document.getElementById("timer");
    let timeLeft = 3600; // 1 hour in seconds
    setInterval(() => {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        timer.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        timeLeft--;
    }, 1000);
}
startCountdown();

// Wallet Connection (Placeholder)
document.querySelector(".wallet-btn").addEventListener("click", async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            alert("Wallet connected!");
        } catch (error) {
            console.error("Wallet connection failed:", error);
        }
    } else {
        alert("Please install MetaMask!");
    }
});

// NFT Loading for Pitbits (No wallet required)
const NFT_CONTRACT_ADDRESS = "0x93Fdd235576203c533269e2AcEB0674068DafA7D";

async function loadNFTs() {
    const gallery = document.getElementById('pitbits-gallery');
    
    if (!gallery) {
        console.error('Pitbits gallery not found');
        return;
    }

    try {
        // Show loading message
        gallery.innerHTML = '<div class="loading-message">Loading NFTs from collection...</div>';
        
        // Initialize NFT loader (no wallet connection needed)
        const nftLoader = new window.NFTLoader(NFT_CONTRACT_ADDRESS);
        
        // Load NFTs from public APIs
        const nfts = await nftLoader.loadNFTs();
        
        // Clear gallery
        gallery.innerHTML = '';
        
        // Display NFTs
        if (nfts && nfts.length > 0) {
            nfts.slice(0, 4).forEach((nft, index) => {
                const pitbitCard = createNFTCard(nft, index);
                gallery.appendChild(pitbitCard);
                
                // Add GSAP animation
                gsap.from(pitbitCard, {
                    y: 50,
                    opacity: 0,
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: "power2.out"
                });
            });
        } else {
            gallery.innerHTML = '<div class="nft-error">No NFTs found. Showing collection preview.</div>';
        }
        
    } catch (error) {
        console.error('Error loading NFTs:', error);
        gallery.innerHTML = '<div class="nft-error">Loading collection preview...</div>';
        
        // Always show fallback content
        setTimeout(async () => {
            const nftLoader = new window.NFTLoader(NFT_CONTRACT_ADDRESS);
            const fallbackNFTs = await nftLoader.getContractBasedNFTs();
            gallery.innerHTML = '';
            
            fallbackNFTs.forEach((nft, index) => {
                const pitbitCard = createNFTCard(nft, index);
                gallery.appendChild(pitbitCard);
            });
        }, 1000);
    }
}

function createNFTCard(nft, index) {
    const card = document.createElement('div');
    card.className = 'pitbit-card';
    
    // Handle image with fallback
    const imageUrl = nft.image || `./assets/pitbits/strategic-element-${(index % 4) + 1}.svg`;
    
    // Determine rarity color
    const rarityColors = {
        'Common': '#4CAF50',
        'Uncommon': '#2196F3', 
        'Rare': '#9C27B0',
        'Epic': '#FF9800',
        'Legendary': '#F44336'
    };
    
    const rarity = nft.traits.find(trait => trait.trait_type === 'Rarity')?.value || 'Common';
    const rarityColor = rarityColors[rarity] || '#FFD700';
    
    card.innerHTML = `
        <div class="pitbit-image">
            <img src="${imageUrl}" alt="${nft.name}" onerror="this.src='./assets/pitbits/strategic-element-${(index % 4) + 1}.svg'">
        </div>
        <h3>${nft.name}</h3>
        <p>${nft.description}</p>
        <div class="nft-id">Token ID: ${nft.id}</div>
        ${rarity !== 'Common' ? `<div class="nft-rarity" style="color: ${rarityColor};">${rarity}</div>` : ''}
    `;
    
    return card;
}

// Load NFTs when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load
    setTimeout(() => {
        if (window.NFTLoader) {
            loadNFTs();
        } else {
            console.error('NFTLoader not available');
            document.getElementById('pitbits-gallery').innerHTML = '<div class="nft-error">NFT loader failed to initialize.</div>';
        }
    }, 1000);
});