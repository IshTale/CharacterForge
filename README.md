CharacterForge: Frontend Design &
UI/UX Specification

1. Product Overview

CharacterForge is a gamified, crowdsourced e-commerce platform designed for the cosplay,
theatrical, and SFX communities. It operates on a "design, try-on, pre-order" model.

The app homepage (`/`) is the **community dashboard** — a grid of published recipes. Creator
flow starts at `/studio`. See [docs/recipe-publishing.md](docs/recipe-publishing.md) for how
publish, storage (`recipes:all` in Vercel KV), and extraction (list vs full recipe) work.

The frontend relies on high-fidelity, static-image processing ("The Digital Canvas") rather than
live-webcam AR, ensuring precise layering of user-generated components. The core output is a
reusable "Recipe" of isolated design components that any user can map onto their own photos.

2. User Flow & Journey

Stage 1: The Discovery Dashboard

●  Layout: A masonry grid layout (Pinterest-style) displaying community-generated character

●

designs.
Interactions: Users can hover over designs to see engagement metrics (pre-orders, likes).
Clicking a design opens a detail view allowing them to "Try On" the design recipe using
their own photos.

●  Call to Action: A prominent floating or sticky "New Design" button in the top/bottom

corner to initialize the CharacterForge creator flow.

Stage 2: Project Initialization (The Canvas Setup)

When a user clicks "New Design," they are prompted to set up their "Digital Canvas."

●  Upload Requirements: The UI presents four distinct dropzones for image uploads to

ensure comprehensive virtual try-on capabilities:
1.  Full Body Frame: For clothing and overall silhouette.
2.  Headshot: Well-lit, face-forward for makeup, hair, hats, earrings, and necklaces.
3.  Hand with Wrist: For rings, bracelets, watches, and nail designs.
4.  Feet: For shoes and anklets.

●  Validation: Basic frontend checks for image resolution and aspect ratio before proceeding.

3. The Digital Canvas: Creator Modules

Once the base photos are uploaded, the user enters a multi-step creation wizard.

Module A: Wardrobe & Accessories (AI Generation & Try-On)

●  Concept: Users define distinct items (Clothes, Jewelry, Shoes) via text prompts or

selections.

●  AI Generation UI: * The user inputs prompts for individual items (e.g., "Cyberpunk leather

jacket," "Neon boots").
○  Crucial Step: The backend triggers parallel AI generation for these items. The frontend
displays loading skeletons, which populate with the generated items rendered on pure
white backgrounds.

●  The Chain Try-On Execution: * The user reviews the isolated items.

○  Upon approval, the items are passed into the Virtual Try-On API chain.
○  The UI displays a progress sequence as items are sequentially layered onto the base

photos (e.g., applying shirt -> applying jacket -> applying belt).

Module B: The Makeup Studio

●  Layout: To prevent excessive scrolling through dozens of cosmetic options, the UI uses an

●

interactive "Mannequin Map".
Interaction: Clicking a region on the mannequin face opens a contextual modal or
side-panel with the relevant sub-options.

●  Categories Available (Based on UI reference):

○  Face: Foundation, Concealer, Blush, Bronzer, Contour, Highlight.
○  Eyes: Eye Shadow, Eye Liner, Eyelashes/Mascara, Eyebrows.
○  Lips: Lip Color, Lip Liner.
○  Misc: Skin Textures/SFX.

●  Customization: Users can select from quick Presets or define their own hex codes and

intensity sliders for custom looks.

Module C: Hair Styling

●  Layout: A streamlined interface utilizing a Singular Master Dropdown (or nested

accordion) to keep the UI clean.

●  Dropdown Categories:

○  AI Hair Style
○  AI Hair Color
○  AI Hair Extension
○  AI Bangs Filter
○  AI Hair Volume

●  Rendering: Selections trigger the Perfect Corp Hair API to re-render the Headshot canvas.

Module D: Nail Art

●  Layout: Similar to the Makeup Studio, utilizing a visual Hand Map to select individual nails

or apply to all.

●  Custom Upload Feature: Alongside color pickers and presets, a primary UI feature is the
"Upload Design" button. Users can upload custom textures, patterns, or graphics (e.g.,
decals, specific polish art) which the frontend maps onto the fingernail coordinates of the
"Hand/Wrist" photo.

4. Output Generation & Data Architecture

The Four Composite Renderings

The UI synthesizes the user's choices and routes them to the correct base image. The final
preview screen displays a 4-pane grid showing the completed look:

1.  Full Body Output: Base Image + Clothes + Bag/Fabric (if applicable).
2.  Headshot Output: Base Image + Makeup + Hair + Hat + Scarf + Earrings + Necklace.
3.  Hand & Wrist Output: Base Image + Watch + Bracelet + Ring + Nails.
4.  Feet Output: Base Image + Shoes.

Data Storage Strategy: "The Recipe"

When the user clicks "Publish recipe" in the studio (see `publishRecipe` in the Zustand store
and `POST /api/recipes`):

Implementation detail: [docs/recipe-publishing.md](docs/recipe-publishing.md).

When the user clicks "Publish to Dashboard" (product spec):

●  What is NOT stored: The final 4 composite images containing the user's actual body/face

are not stored publicly on the dashboard to protect privacy and maintain a clean
marketplace look.

●  What IS stored: The frontend bundles a JSON payload—the "Recipe"—containing:
○  The AI-generated isolated clothing/accessory images (white backgrounds).
○  The hex codes, opacities, and selected API parameters for Makeup and Hair.
○  The custom uploaded nail textures.

●  Dashboard Display: The dashboard generates a dynamic thumbnail using the isolated

clothing items and makeup to create the 4 images from a fake person based on the original
user image we received with similar body structure and skin type.

●  Community Try-On: When User B clicks User A's design, the frontend fetches User A's
"Recipe" payload and runs it through the Virtual Try-On APIs against User B's four base
photos.

5. Technical Stack Considerations (Frontend)

●  Framework: React.js or Next.js for component-driven architecture and state management.
●  State Management: Redux or Zustand to maintain the complex state object (The Recipe)

across the different Modules (Wardrobe -> Makeup -> Hair -> Nails).

●  Styling: Tailwind CSS for rapid UI development of the Pinterest grid, sliders, and

interactive Mannequin maps.

●  API Handling: All calls to Perfect Corp APIs are routed through an internal Serverless

Proxy to protect API keys. The frontend handles optimistic UI updates and loading states
while waiting for the rendering chain to complete.

●  Hosting: The application is hosted on Vercel.
●  Performance Optimization: Intermediate images for each creation step (The Digital
Canvas) are stored in the frontend state. This ensures that when a user navigates
backward, the previously rendered image is used immediately for further transformations,
avoiding redundant calls to the Virtual Try-On APIs.

