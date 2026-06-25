# Context: Takka Loading Screen Animation

This context defines the design terms, ubiquitous language, and animation properties of the initial splash loading screen for the Takka (تكة) restaurant management system.

## Glossary

### Loader Logo (شعار شاشة التحميل)
The brand mark SVG rendered during the loading screen, consisting of three main parts:
- **Logo Dot (`.logo-dot`)**: The red circle button that is pressed.
- **Logo Hand (`.logo-hand`)**: The pointer finger/hand that moves to click the button.
- **Logo Body (`.logo-body`)**: The rest of the SVG representing the complete logo letters/emblem.

### Press Gesture (أنيميشن الضغط)
The synchronized animation cycle where the hand clicks the dot, causing the dot to scale down (`scale(0.82)`) and emit a red drop-shadow glow (`rgba(220, 38, 38, 0.65)`), followed by the fade-in reveal of the rest of the logo body.
