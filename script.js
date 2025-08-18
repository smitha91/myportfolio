/* ===== PORTFOLIO INTERACTIVE FUNCTIONALITY ===== */
/*
 * This JavaScript file handles all interactive features of the portfolio:
 * 1. Smooth scrolling navigation between sections
 * 2. Active navigation link highlighting based on scroll position
 * 3. Intersection Observer for performance-optimized scroll detection
 * 4. Hover effects and animations
 * 5. Dynamic content loading and interactions
 * 
 * Written in vanilla JavaScript for maximum performance and compatibility
 */

// ===== INITIALIZATION =====
/*
 * Wait for DOM content to be fully loaded before executing any scripts
 * This ensures all HTML elements exist before we try to interact with them
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== NAVIGATION SYSTEM =====
    /*
     * Cache DOM elements for navigation functionality
     * Storing these in variables improves performance by avoiding repeated DOM queries
     */
    const navLinks = document.querySelectorAll('.nav-link');     // All navigation menu links
    const sections = document.querySelectorAll('.section');     // All content sections (about, experience, etc.)
    
    // ===== SMOOTH SCROLLING IMPLEMENTATION =====
    /*
     * Add click event listeners to all navigation links
     * When clicked, smoothly scroll to the corresponding section
     */
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor link jump behavior
            
            // Extract target section ID from href attribute (remove the '#' symbol)
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            const mainContent = document.querySelector('.main-content');
            
            // Perform smooth scroll to target section if it exists
            if (targetSection && mainContent) {
                // Calculate the position of the target section relative to the main content container
                const targetPosition = targetSection.offsetTop - mainContent.offsetTop;
                
                // Smooth scroll within the main content container
                mainContent.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== BACK TO TOP FUNCTIONALITY =====
    /*
     * Add click event listeners to all "back to top" airplane links
     * When clicked, smoothly scroll to the very top of the main content area
     */
    const backToTopLinks = document.querySelectorAll('.back-to-top-section, .back-to-top');
    backToTopLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor link jump behavior
            
            const mainContent = document.querySelector('.main-content');
            
            // Smooth scroll to the top of the main content container
            if (mainContent) {
                mainContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== ACTIVE LINK HIGHLIGHTING =====
    /*
     * Function to update navigation highlighting based on current scroll position
     * This provides visual feedback about which section the user is currently viewing
     */
    function updateActiveNavLink() {
        let current = '';                                    // Track currently visible section
        const mainContent = document.querySelector('.main-content'); // Get scrolling container
        const scrollPosition = mainContent.scrollTop + 200;  // Current scroll position with offset
        
        /*
         * Iterate through all sections to determine which one is currently in viewport
         * The 200px offset ensures proper highlighting timing as user scrolls
         */
        sections.forEach(section => {
            const sectionTop = section.offsetTop;            // Distance from top of container to section
            const sectionHeight = section.offsetHeight;      // Total height of the section
            
            // Check if current scroll position falls within this section's boundaries
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');        // Store the ID of current section
            }
        });
        
        /*
         * Update visual styling of navigation links
         * Remove 'active' class from all links, then add it to the current one
         */
        navLinks.forEach(link => {
            link.classList.remove('active'); // Remove active class from all links
            
            // Add active class to the link that matches current section
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    // ===== PERFORMANCE-OPTIMIZED SCROLL HANDLING =====
    // Use requestAnimationFrame to throttle scroll events for better performance
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            // Only update on next animation frame to avoid excessive calls
            requestAnimationFrame(() => {
                updateActiveNavLink(); // Update active navigation
                ticking = false; // Reset throttle flag
            });
            ticking = true; // Set throttle flag
        }
    }
    
    // Listen for scroll events on the main content container (not window)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', onScroll);
    } else {
        // Fallback to window scroll for mobile/other layouts
        window.addEventListener('scroll', onScroll);
    }
    
    // Run initial check when page loads
    updateActiveNavLink();
    
    // ===== INTERACTIVE HOVER EFFECTS =====
    // Add subtle animations to interactive elements when hovered
    const hoverItems = document.querySelectorAll('.experience-item, .project-item, .writing-item');
    
    hoverItems.forEach(item => {
        // Mouse enter - lift element slightly
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)'; // Move up 2px
        });
        
        // Mouse leave - return to original position
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)'; // Return to normal position
        });
    });

    // ===== PROJECT ITEM CLICK FUNCTIONALITY =====
    /*
     * Make entire project boxes clickable - takes user to project page
     * Extracts the URL from the project title link and navigates there
     */
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        // Add click event to entire project box
        item.addEventListener('click', function(e) {
            // Find the project link within this item
            const projectLink = this.querySelector('.project-title a');
            
            // Only proceed if we found a link and the click wasn't directly on a link already
            if (projectLink && !e.target.closest('a')) {
                const projectUrl = projectLink.getAttribute('href');
                
                // Navigate to the project page
                if (projectUrl && projectUrl !== '#') {
                    // Check if it's an external link (has target="_blank") or internal
                    if (projectLink.hasAttribute('target') && projectLink.getAttribute('target') === '_blank') {
                        // Open external link in new tab
                        window.open(projectUrl, '_blank', 'noopener,noreferrer');
                    } else {
                        // Navigate to internal link in same window
                        window.location.href = projectUrl;
                    }
                }
            }
        });
        
        // Add cursor pointer to indicate clickable area
        item.style.cursor = 'pointer';
        
        // Add subtle visual feedback for active state
        item.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(1px)'; // Slight press effect
        });
        
        item.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px)'; // Return to hover state
        });
    });
    
    // ===== EXTERNAL LINK TRACKING =====
    // Add event handlers to external links for analytics or tracking
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Log external link clicks for analytics (can be extended)
            console.log('External link clicked:', this.href);
            // Add Google Analytics, Mixpanel, or other tracking here
        });
    });
    
    // ===== KEYBOARD NAVIGATION ACCESSIBILITY =====
    // Detect when user is navigating with keyboard vs mouse for better accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // User is using keyboard navigation - show focus indicators
            document.body.classList.add('using-keyboard');
        }
    });
    
    // Remove keyboard class when mouse is used
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('using-keyboard');
    });
    
    // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
    // Create observer to animate sections as they come into view
    const mainContentContainer = document.querySelector('.main-content');
    const observerOptions = {
        root: mainContentContainer, // Use main content as scroll root instead of viewport
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element enters viewport
    };
    
    // Callback function when elements enter/leave viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Element is visible - fade in and slide up
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // ===== SECTION FADE-IN ANIMATIONS =====
    // Set up initial state and observe sections for animations
    sections.forEach(section => {
        // Set initial state - invisible and slightly below
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        // Start observing this section
        observer.observe(section);
    });
    
    // ===== SUBTLE PARALLAX EFFECT =====
    // Parallax effect disabled for fixed sidebar layout
    // The sidebar now uses sticky positioning for the fixed effect
    // Parallax would interfere with the sticky behavior
    
    // ===== PAGE LOADING ANIMATION =====
    // Fade in the entire page when it finishes loading
    document.body.style.opacity = '0'; // Start invisible
    document.body.style.transition = 'opacity 0.5s ease'; // Smooth transition
    
    window.addEventListener('load', () => {
        // Fade in when all resources (images, fonts, etc.) are loaded
        document.body.style.opacity = '1';
    });
    
    // ===== EASTER EGG - INTERACTIVE NAME =====
    // Fun interaction when clicking on the name multiple times
    let clickCount = 0;
    const nameElement = document.querySelector('.name');
    
    if (nameElement) {
        nameElement.addEventListener('click', function() {
            clickCount++; // Increment click counter
            
            // After 5 clicks, add a special gradient effect
            if (clickCount === 5) {
                // Apply rainbow gradient to text
                this.style.background = 'linear-gradient(45deg, #22d3ee, #a78bfa)';
                this.style.webkitBackgroundClip = 'text';
                this.style.webkitTextFillColor = 'transparent';
                this.style.backgroundClip = 'text';
                
                // Reset after 3 seconds
                setTimeout(() => {
                    this.style.background = '';
                    this.style.webkitBackgroundClip = '';
                    this.style.webkitTextFillColor = '';
                    this.style.backgroundClip = '';
                    clickCount = 0; // Reset counter
                }, 3000);
            }
        });
    }
    
    // ===== DEVELOPER CONSOLE MESSAGE =====
    // Fun message for fellow developers who inspect the code
    console.log(`
    🚀 Welcome to Ashley's Portfolio!
    
    Thanks for checking out the code. This site is built with:
    - Vanilla HTML, CSS, and JavaScript
    - Modern CSS Grid and Flexbox
    - Intersection Observer API
    - Smooth scrolling navigation
    - Responsive design principles
    
    Feel free to reach out if you'd like to connect!
    `);
    
}); // End of DOMContentLoaded event listener

// ===== ADDITIONAL UTILITY FUNCTIONS =====
// These functions can be called from outside the DOMContentLoaded scope

/**
 * Utility function to smoothly scroll to any element by selector
 * @param {string} selector - CSS selector for target element
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Utility function to check if an element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if element is visible
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ===== EASTER EGG: CYBER MODE =====
let cyberModeActive = false;

// Add double-click listener to name
const nameElement = document.querySelector('.name');
if (nameElement) {
    nameElement.style.cursor = 'pointer';
    nameElement.style.userSelect = 'none';
    
    // Add subtle hover effect
    nameElement.addEventListener('mouseenter', function() {
        if (!cyberModeActive) {
            this.style.textShadow = '0 0 10px rgba(100, 255, 218, 0.5)';
        }
    });
    
    nameElement.addEventListener('mouseleave', function() {
        if (!cyberModeActive) {
            this.style.textShadow = '';
        }
    });
    
    // Double-click to activate cyber mode
    nameElement.addEventListener('dblclick', function() {
        if (!cyberModeActive) {
            activateCyberMode();
        }
    });
}

function activateCyberMode() {
    cyberModeActive = true;
    console.log('🔓 CYBER MODE ACTIVATING...');
    
    // Add cyber mode class to body
    document.body.classList.add('cyber-mode');
    
    // Show cyber badge
    showCyberBadge();
    
    // Console messages for developers
    setTimeout(() => {
        console.log('%c🔓 CYBER MODE ACTIVATED 🔓', 'color: #00ff41; font-size: 20px; font-weight: bold;');
        console.log('%cWelcome to the Matrix...', 'color: #00ff41; font-size: 14px;');
        console.log('%cCurious mind detected! 🧠', 'color: #00ff41; font-size: 14px;');
    }, 500);
}

function showCyberBadge() {
    const badge = document.createElement('div');
    badge.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #00ff41, #0080ff);
        color: #000;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.8rem;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
        animation: cyberpulse 2s infinite;
    `;
    badge.innerHTML = '🔓 Curious Mind Detected!';
    document.body.appendChild(badge);
    
    // Auto-remove badge after 8 seconds
    setTimeout(() => {
        badge.style.opacity = '0';
        badge.style.transition = 'opacity 0.5s ease';
        setTimeout(() => badge.remove(), 500);
    }, 8000);
}
