// GSAP and ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Favicon Theme Detection and Dynamic Change
function updateFavicon() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const favicon = document.querySelector('link[rel="icon"]');
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    const androidIcon192 = document.querySelector('link[rel="icon"][sizes="192x192"]');
    const androidIcon512 = document.querySelector('link[rel="icon"][sizes="512x512"]');
    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
    
    // Set favicon based on theme
    // For dark mode, use white/light logo; for light mode, use black/dark logo
    const iconPath = isDarkMode ? './assets/splogobare.png' : './assets/splogoblack.png';
    
    // Update all favicon types
    if (favicon) {
        favicon.href = iconPath;
    }
    
    if (appleTouchIcon) {
        appleTouchIcon.href = iconPath;
    }
    
    // Update Android-specific favicons
    if (androidIcon192) {
        androidIcon192.href = iconPath;
    }
    
    if (androidIcon512) {
        androidIcon512.href = iconPath;
    }
    
    if (shortcutIcon) {
        shortcutIcon.href = iconPath;
    }
    
    console.log(`Theme detected: ${isDarkMode ? 'Dark' : 'Light'} mode - All favicons updated to: ${iconPath}`);
}

// Update favicon on page load
document.addEventListener('DOMContentLoaded', () => {
    updateFavicon();
});

// Listen for theme changes
if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFavicon);
    
    // Also update immediately
    updateFavicon();
}

// Mobile-responsive scroll trigger settings
const isMobile = window.innerWidth <= 768;
const scrollConfig = {
    titleStart: isMobile ? "top 90%" : "top 95%",
    titleEnd: isMobile ? "bottom 20%" : "top 5%",
    contentStart: isMobile ? "top 85%" : "top 95%",
    contentEnd: isMobile ? "bottom 15%" : "top 5%",
    cardStart: isMobile ? "top 80%" : "top 95%",
    cardEnd: isMobile ? "bottom 10%" : "top 5%"
};

// Update ScrollTrigger on resize
window.addEventListener('resize', () => {
    const newIsMobile = window.innerWidth <= 768;
    if (newIsMobile !== isMobile) {
        ScrollTrigger.refresh();
    }
});

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

// Professional Section Scroll Animations with Extended Duration & Visibility (25% Faster)
gsap.utils.toArray(".section").forEach((section) => {
    const title = section.querySelector("h2");
    const content = section.querySelector("p, .nft-gallery, .pass-container, .origins-gallery, .mint-collections");
    
    // Title animation with reverse - Extended viewing time
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
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: title,
                    start: scrollConfig.titleStart,
                    end: scrollConfig.titleEnd,
                    toggleActions: "play reverse play reverse",
                    onEnter: () => gsap.to(title, { rotationX: 0, duration: 0.9 }),
                    onLeave: () => gsap.to(title, { rotationX: -10, duration: 0.9 }),
                    onEnterBack: () => gsap.to(title, { rotationX: 0, duration: 0.9 }),
                    onLeaveBack: () => gsap.to(title, { rotationX: 10, duration: 0.6 })
                }
            }
        );
    }

    // Content animation with reverse - Extended viewing time
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
                duration: 1.7,
                delay: 0.3,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: content,
                    start: scrollConfig.contentStart,
                    end: scrollConfig.contentEnd,
                    toggleActions: "play reverse play reverse"
                }
            }
        );
    }
});

// Enhanced NFT Card Animations with Extended Viewing Time (25% Faster)
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
            rotationX: 0,
            duration: 1.0,
            delay: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: card,
                start: isMobile ? "top 95%" : "top 99%",
                end: isMobile ? "bottom -25%" : "bottom -100%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        boxShadow: "0 10px 30px rgba(255, 0, 0, 0.2)",
                        duration: 0.9 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                        duration: 0.6 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        boxShadow: "0 10px 30px rgba(255, 0, 0, 0.2)",
                        duration: 0.9 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        boxShadow: "none",
                        duration: 0.6 
                    });
                }
            }
        }
    );
});

// Pass Cards Animation - Container-based for better multi-device support
(() => {
    const passContainer = document.querySelector('.pass-container');
    if (!passContainer) return;
    const passCards = passContainer.querySelectorAll('.pass-card');

    // Animate all pass cards together as a group
    gsap.fromTo(passCards,
        {
            x: (i) => i % 2 === 0 ? -80 : 80,
            y: 50,
            opacity: 0,
            rotation: (i) => i % 2 === 0 ? -6 : 6,
            scale: 0.7
        },
        {
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0,
            scale: 0.85,
            duration: 1.0,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: passContainer,
                start: isMobile ? "top 95%" : "top 99%",
                end: isMobile ? "bottom -300%" : "bottom -600%",
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    passCards.forEach(card => {
                        gsap.to(card, { 
                            borderColor: "rgba(255, 0, 0, 0.3)",
                            duration: 0.5 
                        });
                    });
                },
                onLeave: () => {
                    passCards.forEach(card => {
                        gsap.to(card, { 
                            borderColor: "rgba(255, 0, 0, 0.1)",
                            duration: 1.4 
                        });
                    });
                },
                onEnterBack: () => {
                    passCards.forEach(card => {
                        gsap.to(card, { 
                            borderColor: "rgba(255, 0, 0, 0.3)",
                            duration: 0.5 
                        });
                    });
                },
                onLeaveBack: () => {
                    passCards.forEach(card => {
                        gsap.to(card, { 
                            borderColor: "transparent",
                            duration: 0.4 
                        });
                    });
                }
            }
        }
    );
})();

// Origins Cards Animation with Extended Viewing Time (25% Faster)
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
            duration: 1.2,
            delay: i * 0.08,
            ease: "power2.out",
            scrollTrigger: {
                trigger: card,
                start: scrollConfig.cardStart,
                end: scrollConfig.cardEnd,
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(20px)",
                        background: "rgba(42, 42, 42, 0.98)",
                        duration: 0.6 
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(10px)",
                        background: "rgba(42, 42, 42, 0.8)",
                        duration: 0.4 
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(20px)",
                        background: "rgba(42, 42, 42, 0.98)",
                        duration: 0.6 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        backdropFilter: "blur(5px)",
                        background: "rgba(42, 42, 42, 0.7)",
                        duration: 0.4 
                    });
                }
            }
        }
    );
});

// Mint Collection Cards Animation with Extended Viewing Time (25% Faster)
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
            duration: 1.1,
            delay: i * 0.15,
            ease: "power2.out",
            scrollTrigger: {
                trigger: card,
                start: scrollConfig.cardStart,
                end: scrollConfig.cardEnd,
                toggleActions: "play reverse play reverse",
                onEnter: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 0, 0, 0.3)",
                        boxShadow: "0 8px 20px rgba(255, 0, 0, 0.2)",
                        duration: 0.6
                    });
                },
                onLeave: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 0, 0, 0.1)",
                        boxShadow: "none",
                        duration: 0.4
                    });
                },
                onEnterBack: () => {
                    gsap.to(card, { 
                        borderColor: "rgba(255, 0, 0, 0.4)",
                        boxShadow: "0 10px 25px rgba(255, 0, 0, 0.1)",
                        duration: 1.2 
                    });
                },
                onLeaveBack: () => {
                    gsap.to(card, { 
                        borderColor: "transparent",
                        boxShadow: "none",
                        duration: 0.9 
                    });
                }
            }
        }
    );
});

// Statistics Animation with Count-Up and Extended Viewing Time
gsap.utils.toArray(".stat-item").forEach((stat, i) => {
    // Initial entrance animation
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
            duration: 1.0,
            delay: i * 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: stat,
                start: scrollConfig.cardStart,
                end: scrollConfig.cardEnd,
                toggleActions: "play reverse play reverse"
            }
        }
    );

    // Count-up animation for numbers
    const numberElement = stat.querySelector(".stat-number");
    const target = parseInt(stat.dataset.target);
    const suffix = stat.dataset.suffix || "";
    const decimal = parseInt(stat.dataset.decimal) || 0;
    const special = stat.dataset.special;
    
    if (numberElement && !special) {
        // Set initial value to 0
        numberElement.textContent = "0" + suffix;
        
        // Count-up animation
        gsap.to({ value: 0 }, {
            value: target,
            duration: 2.5,
            delay: i * 0.2 + 0.5,
            ease: "power2.out",
            onUpdate: function() {
                let currentValue = this.targets()[0].value;
                
                // Special handling for volume (11.3k format)
                if (suffix === "k") {
                    let displayValue = (currentValue / 1000).toFixed(decimal);
                    numberElement.textContent = displayValue + suffix;
                } else {
                    numberElement.textContent = Math.round(currentValue) + suffix;
                }
            },
            scrollTrigger: {
                trigger: stat,
                start: isMobile ? "top 70%" : "top 85%",
                toggleActions: "play none none reset"
            }
        });
    }
    
    // Add enhanced hover effects
    stat.addEventListener('mouseenter', () => {
        gsap.to(stat, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Pulse effect on number
        gsap.to(numberElement, {
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out"
        });
    });
    
    stat.addEventListener('mouseleave', () => {
        gsap.to(stat, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        gsap.to(numberElement, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    // Add click functionality for modal (mobile and desktop)
    function handleStatModal(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Stat clicked, opening modal:', stat);
        
        const dropdown = stat.querySelector('.stat-dropdown');
        if (!dropdown) return;
        
        // Get the content from the dropdown
        const dropdownContent = dropdown.querySelector('.stat-dropdown-content');
        if (!dropdownContent) return;
        
        const title = dropdownContent.querySelector('h5').textContent;
        const items = dropdownContent.querySelectorAll('.dropdown-item');
        
        // Open modal with this content
        openStatModal(title, items);
    }
    
    // Add click event listener
    stat.addEventListener('click', handleStatModal);
    
    // Add touch event for mobile
    stat.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleStatModal(e);
    });
    
    // Ensure pointer events are enabled
    stat.style.pointerEvents = 'auto';
    stat.style.cursor = 'pointer';
});

// Modal Functions
function openStatModal(title, items) {
    const modal = document.getElementById('stat-modal');
    const modalTitle = document.getElementById('stat-modal-title');
    const modalBody = document.getElementById('stat-modal-body');
    
    // Set title
    modalTitle.textContent = title;
    
    // Clear and populate body
    modalBody.innerHTML = '';
    items.forEach(item => {
        const modalItem = document.createElement('div');
        modalItem.className = 'modal-item';
        
        const strong = item.querySelector('strong');
        const p = item.querySelector('p');
        
        modalItem.innerHTML = `
            <strong>${strong ? strong.textContent : ''}</strong>
            <p>${p ? p.textContent : ''}</p>
        `;
        
        modalBody.appendChild(modalItem);
    });
    
    // Show modal with animation
    modal.classList.add('active');
    gsap.fromTo(modal, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    
    gsap.fromTo(modal.querySelector('.stat-modal-content'), 
        { scale: 0.8, y: 50 },
        { scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)", delay: 0.1 }
    );
    
    // Animate items in
    gsap.fromTo(modalBody.querySelectorAll('.modal-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: "power2.out", delay: 0.3 }
    );
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeStatModal() {
    const modal = document.getElementById('stat-modal');
    
    gsap.to(modal.querySelector('.stat-modal-content'), {
        scale: 0.8,
        y: 50,
        duration: 0.3,
        ease: "power2.in"
    });
    
    gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Modal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('stat-modal');
    const closeBtn = modal.querySelector('.stat-modal-close');
    const overlay = modal.querySelector('.stat-modal-overlay');
    
    // Close button
    closeBtn.addEventListener('click', closeStatModal);
    
    // Overlay click
    overlay.addEventListener('click', closeStatModal);
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeStatModal();
        }
    });
    
    // Prevent modal content clicks from closing modal
    modal.querySelector('.stat-modal-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Close dropdowns when clicking outside (Legacy - can be removed)
document.addEventListener('click', (e) => {
    if (!e.target.closest('.stat-item')) {
        console.log('Clicking outside, closing all dropdowns'); // Debug log
        document.querySelectorAll('.stat-item.active').forEach(item => {
            item.classList.remove('active');
            
            // Reset any inline styles
            const dropdown = item.querySelector('.stat-dropdown');
            if (dropdown) {
                dropdown.style.display = '';
                dropdown.style.opacity = '';
                dropdown.style.visibility = '';
            }
        });
    }
});

// Additional initialization to ensure stat items are properly set up
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing stat items for modal...');
    
    // Wait for GSAP animations to complete
    setTimeout(() => {
        const statItems = document.querySelectorAll('.stat-item');
        console.log('Found stat items:', statItems.length);
        
        statItems.forEach((item, index) => {
            const dropdown = item.querySelector('.stat-dropdown');
            console.log(`Stat item ${index}:`, item);
            console.log(`Has dropdown content:`, dropdown ? 'Yes' : 'No');
            
            if (dropdown) {
                // Hide dropdown since we're using modal
                dropdown.style.display = 'none';
                
                // Add visual indicator that item is clickable
                item.style.cursor = 'pointer';
                item.style.userSelect = 'none';
                
                // Add subtle hover effect
                item.addEventListener('mouseenter', () => {
                    gsap.to(item, {
                        scale: 1.02,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                });
                
                item.addEventListener('mouseleave', () => {
                    gsap.to(item, {
                        scale: 1,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                });
            }
        });
        
        console.log('Stat modal initialization complete');
    }, 500);
});

// Hero Section Animation (Super Fast)
gsap.timeline()
    .from(".hero-logo img", {
        y: 80,
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "power3.out"
    })
    .from(".hero-content p", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
    }, "-=0.5")
    .from(".cta-btn", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
    }, "-=0.3");

// Footer - Always Visible (No Animation)
// Footer is now always visible at the bottom without loading animation

// Sliding Pitbits and Pixel Art Cards with Extended Viewing Time (25% Faster)
gsap.utils.toArray(".pitbit-card, .pixel-art-card").forEach((card, i) => {
    gsap.from(card, {
        x: i % 2 === 0 ? -120 : 120,
        opacity: 0,
        duration: 1.0,
        delay: i * 0.1,
        ease: "power2.out",
        scrollTrigger: {
            trigger: card,
            start: "top 95%",
            end: "top 5%",
            toggleActions: "play reverse play reverse"
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
        const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
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

// Countdown Timer (only if timer element exists)
function startCountdown() {
    const timer = document.getElementById("timer");
    if (!timer) return; // Exit if timer element doesn't exist
    
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

// NFT Loading for Pitbits (Only if gallery exists)
const NFT_CONTRACT_ADDRESS = "0x93Fdd235576203c533269e2AcEB0674068DafA7D";

async function loadNFTs() {
    const gallery = document.getElementById('pitbits-gallery');
    
    if (!gallery) {
        console.log('Pitbits gallery not found - section is commented out in HTML');
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
