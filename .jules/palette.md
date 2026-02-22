# Palette Journal
## Critical UX/Accessibility Learnings Only

## 2025-05-15 - Floating Action Buttons in Car Mode
**Learning:** Standard header buttons are too small and hard to reach while driving (even in simulation). A large floating action button (FAB) for voice search significantly improves accessibility in a "Car Mode" context.
**Action:** Transformed the voice search into a large FAB in Car Mode and implemented themes using CSS variables to allow users to match their favorite music app's aesthetic.

## 2025-05-23 - Road to 2027: Neo-Glass Redesign
**Philosophy:** Moved towards a "Neo-Glass" aesthetic characterized by deep dark backgrounds, vivid animated mesh gradients, and heavy glassmorphism (blur + saturation).
**Key Changes:**
- **Refactor:** Decoupled HTML/CSS/JS for better maintainability.
- **Structure:** Transformed the player bar into a floating "Capsule" to maximize screen real estate and modernize the look.
- **Immersion:** Added a Web Audio API visualizer that reacts to music in real-time, creating a living background.
- **Interaction:** Cards now have physics-like hover states, and Voice Search becomes a full-screen immersive overlay.
- **Car Mode:** Enhanced accessibility with even larger touch targets while maintaining the new aesthetic.
