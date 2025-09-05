/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  mode: "jit",
  theme: {
    extend: {
      colors: {
        primary: "#00040f",
        secondary: "#8A2BE2",
        dimWhite: "rgba(255, 255, 255, 0.7)",
        dimBlue: "rgba(9, 151, 124, 0.1)",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      keyframes: {
        'slide-in': {
          '0%': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          }
        }
      },
      animation: {
        // Cascade animation speeds for bid history items
        'slide-in-fast-1': 'slide-in 0.2s ease-out forwards', // First item (fastest)
        'slide-in-fast-2': 'slide-in 0.3s ease-out forwards', // Second item
        'slide-in-fast-3': 'slide-in 0.4s ease-out forwards', // Third item
        'slide-in-fast-4': 'slide-in 0.5s ease-out forwards', // Fourth item
        'slide-in-fast-5': 'slide-in 0.6s ease-out forwards', // Fifth item (slowest)
        'slide-in-slow': 'slide-in 3s ease-out forwards',     // Regular slow animation
      }
    },
    screens: {
      xs: "480px",   // Extra small devices
      ss: "620px",   // Small-medium devices
      sm: "768px",   // Small devices (tablets)
      md: "1060px",  // Medium devices (landscape tablets)
      lg: "1200px",  // Large devices (desktops)
      xl: "1700px",  // Extra large devices
    },
  },
  plugins: [
    // Plugin to hide scrollbars while maintaining functionality
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
};