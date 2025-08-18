# Ashley Smith Portfolio

A modern, responsive portfolio website showcasing full-stack development skills, built with vanilla HTML, CSS, and JavaScript.

## 🌟 Live Demo

Visit the portfolio at: [https://smitha91.github.io/my-portfolio/](https://smitha91.github.io/my-portfolio/)

## 📋 Table of Contents

- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Styling Approach](#styling-approach)
- [JavaScript Functionality](#javascript-functionality)
- [Projects Showcase](#projects-showcase)
- [Installation & Setup](#installation--setup)
- [Technologies Used](#technologies-used)
- [Design Inspiration](#design-inspiration)
- [Showcase Talking Points](#showcase-talking-points)

## ✨ Features

### Core Features
- **Sticky Sidebar Navigation**: Left sidebar stays fixed while content scrolls
- **Smooth Scrolling**: Seamless navigation between sections
- **Interactive Cursor Light**: Custom cursor effect with radial gradient
- **Responsive Design**: Optimized for different screen sizes
- **Project Integration**: Links to live projects including aviation API and authentication systems
- **Social Media Integration**: Direct links to GitHub, LinkedIn, CodePen, and Instagram

### Advanced Features
- **Ephemeral Authentication System**: Session-based login with automatic data cleanup
- **Aviation Crew Communication API**: JWT-based REST API with role-based access control
- **Real-time Browser Testing**: Interactive API testing interface
- **Consolidated Server Architecture**: Single server handling multiple projects

## 🏗️ Technical Architecture

### Frontend Architecture
```
Portfolio (Client-Side)
├── HTML Structure (Semantic markup)
├── CSS Styling (Custom properties + flexbox)
├── JavaScript Interactivity (Vanilla JS)
└── Asset Management (Images, fonts, icons)
```

### Backend Architecture
```
Node.js Server
├── Express.js Framework
├── Static File Serving
├── API Routes
│   ├── Aviation API (/aviation-*)
│   ├── Authentication (/login)
│   └── Project Routes (/charolotte)
└── Security Features (JWT, encryption)
```

## 📁 Project Structure

```
myportfolio/
├── README.md                 # Project documentation
├── server.js                 # Main server file - handles all routing
├── package.json              # Dependencies and scripts
├── landingpage/              # Main portfolio site
│   ├── index.html            # Homepage structure
│   ├── style.css             # All styling rules
│   ├── script.js             # Interactive functionality
│   └── photos/               # Project screenshots
│       ├── p2.png            # Secure login system image
│       └── p3.png            # Aviation API image
├── charolotteicecream/       # Ice cream shop project
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── images/
└── secureLoginFeature/       # Authentication system
    └── views/
        └── index.ejs
```

## 🔑 Key Components

### 1. Sticky Sidebar Layout
**File**: `landingpage/style.css` (lines 23-45)

The portfolio uses a split-screen layout where:
- **Left Side (Sidebar)**: Contains name, navigation, social links - stays fixed
- **Right Side (Main Content)**: Scrollable content sections

**CSS Implementation**:
```css
.container {
    display: flex;           /* Side-by-side layout */
    min-height: 100vh;       /* Full viewport height */
}

.sidebar {
    position: sticky;        /* Stays in place during scroll */
    top: 0;                 /* Stick to top of viewport */
    height: 100vh;          /* Full height */
    width: 50%;             /* Half the container */
}
```

### 2. Navigation System
**File**: `landingpage/script.js`

Features smooth scrolling and active state management:
- Detects which section is currently in view
- Updates navigation highlights accordingly
- Provides smooth scrolling to sections

### 3. Cursor Light Effect
**File**: `landingpage/index.html` (lines 320-340)

Custom JavaScript creates a following light effect:
- Tracks mouse movement in real-time
- Creates radial gradient that follows cursor
- Uses CSS `mix-blend-mode` for visual blending

### 4. Project Integration
Each project is a separate application but integrated into the portfolio:
- **SkyList Task Management**: Aviation-themed task manager with local storage persistence
- **Charlotte's Ice Cream**: Interactive website with dynamic JavaScript features
- **Secure Login System**: EJS templating with session management
- **Aviation API**: Full REST API with JWT authentication

## 🎨 Styling Approach

### Design System
- **Font Family**: Inter (Google Fonts) - modern, readable typography
- **Color Scheme**: Dark theme with slate colors
- **Accent Color**: Bright cyan (#64ffda) for highlights
- **Spacing**: Consistent 4rem (64px) spacing system

### CSS Architecture
1. **Reset & Base Styles**: Normalize browser defaults
2. **Layout Components**: Container, sidebar, main content
3. **UI Components**: Navigation, buttons, cards
4. **Interactive States**: Hover effects, transitions
5. **Responsive Design**: Mobile-first approach

### Key CSS Techniques
- **Flexbox Layout**: For sidebar and content arrangement
- **CSS Custom Properties**: For consistent theming
- **Sticky Positioning**: For fixed sidebar behavior
- **CSS Grid**: For project and writing item layouts

## ⚡ JavaScript Functionality

### Portfolio JavaScript Features
1. **Smooth Scrolling Navigation**
   - Intercepts navigation clicks
   - Animates scroll to target sections
   - Updates active navigation state

2. **Intersection Observer**
   - Detects which section is in viewport
   - Updates navigation highlights
   - Triggers animations when sections come into view

3. **Cursor Light Effect**
   - Real-time mouse position tracking
   - Dynamic element positioning
   - Opacity transitions for smooth appearance

### Charlotte's Ice Cream JavaScript Features
1. **Interactive Flavor Showcase**
   - Click-to-view functionality on ice cream images
   - Hover effects with scale transformations and shadows
   - Dynamic modal creation and management

2. **Modal System**
   - Programmatically generated modal content
   - Detailed flavor descriptions and imagery
   - Multiple close methods (click, escape key, outside click)
   - CSS animations created via JavaScript

3. **Order Management System**
   - Simulated order process with loading states
   - Dynamic button text updates and color changes
   - Order confirmation notifications
   - Slide-in animations for notifications

4. **Enhanced User Experience**
   - Time-based dynamic greetings
   - Smooth page loading animations
   - Keyboard accessibility support
   - Mobile-responsive interactions

### SkyList Task Management Technical Implementation

**Architecture Pattern**: Model-View-Controller (MVC) in vanilla JavaScript

1. **State Management**
   - Centralized task array with demo data
   - Task objects with comprehensive metadata (ID, text, timestamps, priority)
   - Current filter and section tracking
   - Auto-incrementing ID counter for unique task identification

2. **DOM Interaction & Performance**
   - Cached DOM element references for efficiency
   - Event delegation for dynamic task elements
   - Virtual DOM-like rendering with complete list regeneration
   - Optimized animation delays with staggered timing

3. **CRUD Operations**
   - **Create**: Input validation, task object creation, array manipulation
   - **Read**: Filtered task retrieval with sorting algorithms
   - **Update**: Toggle completion status with timestamp management
   - **Delete**: Array splicing with user confirmation dialogs

4. **Data Persistence**
   - localStorage integration with error handling
   - Automatic save operations with debouncing (500ms delay)
   - JSON serialization/deserialization with validation
   - Graceful fallback for localStorage unavailability

5. **User Experience Features**
   - Real-time notification system with custom styling
   - Smooth animations using CSS keyframes and JavaScript delays
   - Keyboard accessibility (Enter, Space, Tab navigation)
   - Form validation with visual feedback and reset timers

6. **Aviation Theme Implementation**
   - Boarding pass-style task cards with perforated edges
   - Sky gradient backgrounds with cloud patterns
   - Aviation terminology throughout (takeoff, landing, flights)
   - Cockpit-inspired button designs and interactions

7. **Developer Tools**
   - Debug console with sample data generators
   - Task inspection utilities
   - Bulk operations for testing (clear all, add samples)
   - Comprehensive error logging and warnings

### Code Organization
- **Event Listeners**: Set up on DOM content loaded
- **Utility Functions**: Reusable helper functions
- **State Management**: Track active sections and navigation
- **Dynamic Styling**: CSS created and applied via JavaScript

## 🚀 Projects Showcase

### 1. SkyList - Aviation Task Management
**Technology Stack**: JavaScript (ES6+), HTML5, CSS3, Local Storage
**Features**:
- Aviation-themed task management with boarding pass-style UI
- Full CRUD operations (Create, Read, Update, Delete tasks)
- Real-time statistics dashboard with completion tracking
- Local storage persistence for task data
- Filter system: All Flights, Scheduled (pending), Landed (completed)
- Interactive notifications with aviation terminology
- Responsive design with sky gradient backgrounds
- Keyboard accessibility and screen reader support
- Smooth animations and micro-interactions
- Developer debug tools for testing

### 2. Aviation Crew Communication API
**Technology Stack**: Node.js, Express, JWT, Encryption
**Features**:
- Role-based access control (Pilot, Flight Attendant, Ground Crew)
- Message encryption for secure communication
- Real-time browser testing interface
- RESTful API design with comprehensive endpoints

### 3. Secure Login System
**Technology Stack**: Node.js, Express, EJS
**Features**:
- Ephemeral session management
- Immediate user registration
- Complete data cleanup on logout
- Session-based authentication

### 4. Charlotte's Ice Cream Shop
**Technology Stack**: HTML, CSS, JavaScript
**Features**:
- Interactive flavor showcase with clickable ice cream images
- Dynamic modal system for detailed flavor information
- Click-to-order functionality with simulated cart system
- Order confirmation notifications with smooth animations
- Time-based dynamic greetings (Good Morning/Afternoon/Evening)
- Hover effects and image transformations
- Keyboard accessibility (Escape key support)
- Smooth page loading animations
- Mobile-first responsive design
- Clean, semantic HTML structure

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Quick Start
```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd myportfolio

# Install dependencies
npm install

# Start the development server
npm start

# Visit in browser
http://localhost:3000
```

### Development Commands
```bash
npm start          # Start the server
npm run dev        # Development mode with auto-restart
npm test           # Run tests (if available)
```

## 💻 Technologies Used

### Frontend
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with flexbox and grid
- **JavaScript (ES6+)**: Interactive functionality
- **Google Fonts**: Typography (Inter font family)

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **EJS**: Templating engine for dynamic content
- **JWT**: JSON Web Tokens for authentication

### Development Tools
- **VS Code**: Code editor
- **Git**: Version control
- **npm**: Package management

## 🎯 Design Inspiration

The portfolio design is inspired by [Brittany Chiang's portfolio](https://brittanychiang.com/), featuring:
- Clean, minimalist aesthetic
- Split-screen layout with fixed sidebar
- Dark theme with cyan accents
- Smooth animations and transitions
- Focus on typography and readability

## 🎤 Showcase Talking Points

### For Technical Interviews
1. **Architecture Decisions**:
   - "I chose a single-server architecture to demonstrate full-stack capabilities while maintaining simplicity"
   - "The sticky sidebar uses CSS positioning rather than JavaScript for better performance"

2. **Problem Solving**:
   - "I implemented ephemeral sessions to balance security with user experience"
   - "The cursor light effect uses requestAnimationFrame for smooth 60fps performance"

3. **Code Quality**:
   - "I used semantic HTML for accessibility and SEO"
   - "CSS is organized by component with consistent naming conventions"

### For Project Demonstrations
1. **Aviation API**: "This demonstrates secure API design with JWT authentication and role-based permissions"
2. **Authentication System**: "Shows understanding of session management and security best practices"
3. **Portfolio Design**: "Responsive design that works across devices with smooth interactions"

### Technical Challenges Solved
1. **Layout Stability**: Fixed sidebar without scroll conflicts
2. **Performance**: Optimized cursor tracking and smooth animations
3. **Integration**: Multiple projects unified under single server
4. **User Experience**: Intuitive navigation with visual feedback

## 📚 Learning Outcomes

### Frontend Skills Demonstrated
- Semantic HTML structure
- Advanced CSS layouts (flexbox, grid)
- Vanilla JavaScript DOM manipulation
- Responsive web design principles
- Performance optimization techniques

### Backend Skills Demonstrated
- RESTful API design
- Authentication and authorization
- Server-side routing
- Security best practices
- Session management

### Development Practices
- Code organization and documentation
- Git version control
- Project structure planning
- Testing and debugging
- Performance considerations

---

**Built with ❤️ by Ashley Smith**

*This portfolio showcases the intersection of thoughtful design and robust engineering, demonstrating skills in both frontend user experience and backend system architecture.*
