**CharacterForge**

File System Architecture

*Comprehensive Folder, File & Class Reference*

Next.js / Vercel | Perfect Corp API Integration | v1.0 | May 2026

|  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| **📁 FOLDER** | **📄 FILE** | **⬡ CLASS** | **⬡ INTERFACE** | **⬡ HOOK** | **⬡ FUNCTION** |

# **Table of Contents**

# **1. Project Root**

CharacterForge is a Next.js 14 (App Router) application deployed on Vercel. The root contains global configuration files and entry points for the build system, type checking, and dependency management.

|  |  |
| --- | --- |
| **📄 FILE** | **next.config.ts** |

|  |
| --- |
| Next.js configuration. Enables Vercel Blob image domains, configures the experimental server actions flag, and sets the image remote patterns to allow Perfect Corp result CDN URLs (\*.perfectcorp.com, \*.makeupar.com). Also activates the SSE streaming response size override needed for long polling sessions. |

|  |  |
| --- | --- |
| **📄 FILE** | **middleware.ts** |

|  |
| --- |
| Vercel Edge Middleware that runs before every request. Validates session cookies, injects CORS headers on /api/\* routes, and blocks direct access to /api/perfectcorp/\* from browser origins other than the app's own domain — enforcing the serverless proxy security boundary. |

|  |  |
| --- | --- |
| **📄 FILE** | **tailwind.config.ts** |

|  |
| --- |
| Tailwind CSS configuration. Extends the default palette with CharacterForge brand tokens: canvas-headshot, canvas-fullbody, canvas-hand, canvas-feet. Configures the content glob to include all components and app routes. |

|  |  |
| --- | --- |
| **📄 FILE** | **tsconfig.json** |

|  |
| --- |
| TypeScript compiler options. Sets strict mode, path aliases (@/ → ./src/), and module resolution to Bundler. Excludes node\_modules and .next build output. |

|  |  |
| --- | --- |
| **📄 FILE** | **.env.local (template)** |

|  |
| --- |
| Environment variable template (committed without values). Documents all required secrets: PERFECTCORP\_V2\_API\_KEY, PERFECTCORP\_V1\_CLIENT\_ID, PERFECTCORP\_V1\_CLIENT\_SECRET, BLOB\_READ\_WRITE\_TOKEN, KV\_REST\_API\_URL, KV\_REST\_API\_TOKEN. |

# **2. /app — Next.js App Router**

All routes, pages, layouts, and API handlers live here. Next.js App Router conventions apply: each folder represents a URL segment; layout.tsx wraps child pages; route.ts files define API endpoints. The app has three primary route groups: the design studio, the community feed, and the serverless API proxy.

|  |  |
| --- | --- |
| **📄 FILE** | **app/layout.tsx** |

|  |
| --- |
| Root layout wrapping every page. Provides the HTML shell, global fonts (Inter), Zustand provider, React Query client provider, and Toaster notification component. Imports global.css. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/page.tsx** |

|  |
| --- |
| Landing page. Displays the CharacterForge hero section with a four-pane preview of example character designs. Links to /studio for new designs and /community for browsing published recipes. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/global.css** |

|  |
| --- |
| Global stylesheet. Defines CSS custom properties for the four canvas accent colours, animation keyframes for the progress skeleton pulse, and base reset rules. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/** |

|  |
| --- |
| The main design studio — the primary user-facing route. Houses the four-module workflow: Wardrobe → Makeup → Hair → Nails+Jewelry. Contains the four-pane canvas preview and the step-by-step navigation shell. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/layout.tsx** |

|  |
| --- |
| Studio layout. Renders the persistent four-pane canvas preview on the right half of the screen and the module navigation sidebar on the left. Subscribes to Zustand CanvasState to live-update the previews as API results arrive via SSE. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/page.tsx** |

|  |
| --- |
| Studio home — redirects to /studio/upload if no base photos have been uploaded yet, otherwise redirects to /studio/wardrobe. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/upload/** |

|  |
| --- |
| Upload wizard for the four base photos. Validates file type, size, and resolution client-side before dispatching to the proxy. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/upload/page.tsx** |

|  |
| --- |
| Four-slot photo upload UI. Each slot corresponds to one canvas (Headshot, Full Body, Hand & Wrist, Feet). On file selection calls the ImageValidator utility, then dispatches setBasePhoto to the Zustand store and triggers the file upload proxy route to obtain file\_ids. Renders canvas-specific guidance overlays showing the required pose. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/wardrobe/** |

|  |
| --- |
| Module A — Wardrobe & Accessories. Lets the designer describe garments with text prompts and apply AI-generated clothing, hats, bags, and shoes. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/wardrobe/page.tsx** |

|  |
| --- |
| Wardrobe module page. Contains the prompt input for AI Image Generator, a garment type selector (upper\_body / lower\_body / dresses / full\_body), and accessory selectors for Hat, Bag, and Shoes with reference photo upload slots. On submit, calls triggerRender(['wardrobe']) in the Zustand store. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/makeup/** |

|  |
| --- |
| Module B — Makeup Studio. Provides per-category sliders, colour pickers, and pattern selectors for all 13 makeup effect categories. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/makeup/page.tsx** |

|  |
| --- |
| Makeup module page. Renders the MakeupEffectPanel for each category (Foundation, Concealer, Blush, Bronzer, Contour, Highlighter, Eyebrows, Eye Shadow, Eye Liner, Eyelashes, Lip Color, Lip Liner, Skin Smooth). Supports switching between Custom (individual effects) and Preset (Look VTO / makeup transfer) modes. Sends a full effects[] array on every change — does not send incremental diffs. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/hair/** |

|  |
| --- |
| Module C — Hair Styling. Exposes the five hair APIs (Style, Color, Extension, Bangs, Volume) through a unified style-picker UI. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/hair/page.tsx** |

|  |
| --- |
| Hair module page. Loads available style groups via the style-discovery endpoints. Renders five collapsible sections, one per hair API. Each section shows a scrollable grid of style thumbnails. Active selections are written to recipe.hair in the Zustand store. On Apply, calls triggerRender(['hair']) which executes the chained hair pipeline. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/studio/nails/** |

|  |
| --- |
| Module D — Nail Art & Jewelry. Combines Nail VTO configuration with the four jewelry APIs. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/studio/nails/page.tsx** |

|  |
| --- |
| Nails and jewelry module page. Contains: (1) HandMapSelector — an SVG diagram of a hand where clicking individual fingers sets the apply\_to nail target; (2) Nail configuration panel — colour picker, texture selector, shape selector, and custom texture upload; (3) Jewelry sub-panels for Ring (with finger selector), Bracelet (with wrist selector), Watch (with wrist selector), and Necklace (reference photo upload). |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/community/** |

|  |
| --- |
| Community feed and recipe try-on routes. Displays published Recipes from all users and allows any user to try on any recipe against their own base photos. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/community/page.tsx** |

|  |
| --- |
| Community browse page. Fetches paginated list of published recipes from the CharacterForge database. Renders a masonry grid of RecipeCard components showing the four-pane preview from the original author. Supports filtering by tags and sorting by newest / most tried. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/community/[recipe\_id]/page.tsx** |

|  |
| --- |
| Recipe try-on page. Fetches the Recipe JSON by ID. If the viewer has uploaded base photos (stored in Zustand), immediately dispatches the full rendering pipeline against their photos. Shows side-by-side comparison of the author's result and the viewer's live try-on. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/api/** |

|  |
| --- |
| All serverless API routes. Acts as the secure proxy between the browser and Perfect Corp APIs. Credentials are injected server-side. The browser never has direct access to Perfect Corp endpoints. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **app/api/perfectcorp/[module]/** |

|  |
| --- |
| Dynamic route segment matching all 17 Perfect Corp module slugs: makeup-vto | ai-look-vto | nail-vto | cloth | hat | bag | shoes | ring | bracelet | watch | necklace | hair-style | hair-color | hair-ext | hair-bang | hair-vol | image-gen. Each sub-route implements one step of the universal async task pattern. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/perfectcorp/[module]/file/route.ts** |

|  |
| --- |
| File upload proxy (POST). Receives the base photo as multipart/form-data. Checks the Vercel KV cache for an existing file\_id (SHA-256 keyed). On cache miss: stores the file in Vercel Blob to obtain a public URL, calls the Perfect Corp file endpoint to get a pre-signed S3 URL, PUTs the image binary to S3, caches the returned file\_id in Vercel KV with a 23-hour TTL. Returns { file\_id, public\_url } to the client. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **POST handler** |

|  |
| --- |
| Named export "POST". Entry point for the Next.js route. Reads the module param from the URL, validates the incoming file (type, size), delegates to FileUploadService, and returns JSON. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/perfectcorp/[module]/task/route.ts** |

|  |
| --- |
| Task dispatch and SSE streaming proxy (POST). Receives task parameters from the client (file\_ids, recipe fields). Calls the Perfect Corp task endpoint to start the async job. Opens an SSE stream back to the client. Launches the polling loop (PollOrchestrator) and emits progress events until task\_status is success or error. On success, emits the result image URL. On error, emits a normalised error object. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **POST handler** |

|  |
| --- |
| Named export "POST". Validates module and parameters, delegates task creation to PerfectCorpClient, and streams polling events via SSE using a ReadableStream. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/perfectcorp/[module]/task/[id]/route.ts** |

|  |
| --- |
| Manual task status check (GET). Fallback endpoint for clients that cannot maintain an SSE connection. Returns the current task\_status and result URL if available. Used by the client-side polling fallback when the SSE stream drops. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **GET handler** |

|  |
| --- |
| Named export "GET". Reads task\_id from URL params, calls PerfectCorpClient.getTaskStatus(), and returns the normalised status payload. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/auth/v1/route.ts** |

|  |
| --- |
| v1.0 RSA token exchange endpoint (POST). Internal-only route called by the server during v1.0 Hair API requests. Constructs the RSA-encrypted id\_token, POSTs to the Perfect Corp auth endpoint, caches the returned access\_token in Vercel KV, and returns it to the calling server function. Implements a mutex via KV atomic compare-and-swap to prevent duplicate auth calls under concurrency. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/recipes/route.ts** |

|  |
| --- |
| Recipe persistence endpoints. GET returns paginated published recipes. POST saves a new Recipe JSON to the CharacterForge database (Vercel Postgres) and returns the recipe\_id. Validates that user-uploaded photo references are not included in the Recipe JSON before persisting. |

|  |  |
| --- | --- |
| **📄 FILE** | **app/api/recipes/[recipe\_id]/route.ts** |

|  |
| --- |
| Single recipe endpoints. GET returns the full Recipe JSON. DELETE removes the recipe (author only). PATCH updates the recipe's tags or title (author only). |

# **3. /lib — Core Business Logic**

All server-side logic that is reused across multiple API routes lives here. Strictly server-only (no browser APIs). Organised into five sub-systems: auth, perfectcorp client, pipeline orchestration, storage adapters, and validation.

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/auth/** |

|  |
| --- |
| Authentication layer. Manages credentials for both Perfect Corp API families. Neither file is ever imported by client components — they are server-only. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/auth/v2-bearer.ts** |

|  |
| --- |
| v2.0 Bearer token provider. Reads PERFECTCORP\_V2\_API\_KEY from environment and returns the Authorization header string. Stateless — no token expiry management required for this family. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **getBearerHeaders** |

|  |
| --- |
| Returns { Authorization: "Bearer <key>", "Content-Type": "application/json" }. Throws if the environment variable is missing. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/auth/v1-rsa.ts** |

|  |
| --- |
| v1.0 RSA token manager. Handles the full two-step authentication flow: RSA-encrypt the client\_id+timestamp plaintext with the Base64-decoded X.509 client\_secret, exchange for an access\_token, cache in Vercel KV for 2 hours, and refresh proactively 5 minutes before expiry. A mutex (implemented via KV atomic writes) prevents duplicate auth calls under concurrent requests. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **RsaTokenManager** |

|  |
| --- |
| Singleton class managing the v1.0 access\_token lifecycle. |

|  |  |
| --- | --- |
| **getAccessToken()** | Returns a valid access\_token. Checks KV cache first; if expired or missing, acquires mutex, re-authenticates, stores new token, releases mutex. |
| **buildIdToken()** | Private. Constructs the RSA-encrypted id\_token from CLIENT\_ID + current timestamp in milliseconds. |
| **exchangeIdToken(idToken)** | Private. POSTs to /s2s/v1.0/client/auth and returns the access\_token string. |
| **acquireMutex()** | Private. Uses KV SET NX with a 30s TTL to implement distributed mutex for token refresh. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/perfectcorp/** |

|  |
| --- |
| HTTP client and task orchestration for all 17 Perfect Corp API modules. Abstracts the three-step async task pattern (Upload → Dispatch → Poll) behind a single promise-based interface. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/client.ts** |

|  |
| --- |
| Base HTTP client for Perfect Corp APIs. Routes requests to the correct base URL (v2.0: yce-api-01.makeupar.com / v1.0: yce-api-01.perfectcorp.com) and injects the correct auth header for each module family. Implements exponential backoff for 429 responses (1s, 2s, 4s, 8s — max 4 retries). Normalises all engine error codes into { code, message, retryable }. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **PerfectCorpClient** |

|  |
| --- |
| Central HTTP client. Instantiated once per API route invocation. |

|  |  |
| --- | --- |
| **uploadFile(module, imageBuffer)** | Calls the /file endpoint, obtains pre-signed S3 URL, PUTs binary, returns file\_id. |
| **startTask(module, params)** | POSTs to the /task endpoint and returns task\_id. Does not begin polling. |
| **getTaskStatus(module, taskId)** | GETs /task/<id> and returns { status, result\_url, polling\_interval }. |
| **request(method, url, body, authFamily)** | Private. Performs the fetch with correct headers, retries on 429 with backoff, normalises errors. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/poller.ts** |

|  |
| --- |
| Async task polling orchestrator. Polls a task until success or error, emitting progress events on a callback. Respects the polling\_interval returned by the API (typically 500ms). Stops after 120 attempts (60s timeout). On timeout, throws a TaskTimeoutError. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **PollOrchestrator** |

|  |
| --- |
| Manages the polling loop for a single task\_id. |

|  |  |
| --- | --- |
| **poll(module, taskId, onProgress)** | Polls at the API-specified interval. Calls onProgress({ attempt, status }) on each tick. Resolves with the result URL on success. |
| **TaskTimeoutError** | Thrown when 120 polling attempts complete without a terminal status. Signals the client to re-submit. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/perfectcorp/modules/** |

|  |
| --- |
| One file per API module family. Each file exports typed request-builder functions that construct the exact JSON body for that API, then call PerfectCorpClient. Keeps endpoint-specific logic (enums, required fields, chaining patterns) isolated from the generic client. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/image-gen.ts** |

|  |
| --- |
| AI Image Generator module. Builds the request body for /s2s/v2.0/task/image-gen. Supports parallel fan-out of multiple item prompts using Promise.allSettled(). |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **generateItems** |

|  |
| --- |
| Accepts an array of { prompt, style\_group\_id, style\_id } objects. Fans out all task POSTs simultaneously, polls each independently, returns an array of settled result URLs. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/wardrobe.ts** |

|  |
| --- |
| Clothes, Hat, Bag, and Shoes try-on modules. Handles the garment\_category enum validation, change\_shoes flag, and the chain try-on pattern where the dst\_id of one clothes task becomes the src\_id of the next. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyClothes** |

|  |
| --- |
| Applies a single garment to the Full Body canvas. Accepts src (file\_id or dst\_id from previous step), ref (garment image), garment\_category, gender. Returns dst\_id for chaining. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **chainClothes** |

|  |
| --- |
| Applies an ordered array of garments sequentially. Threads dst\_id through each step. Returns the final dst\_id. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHat** |

|  |
| --- |
| Calls /task/hat with the Headshot Canvas. Returns dst\_id. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyBag** |

|  |
| --- |
| Calls /task/bag with the Full Body Canvas and required gender param. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyShoes** |

|  |
| --- |
| Calls /task/shoes with the Feet Canvas and required gender param. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/makeup.ts** |

|  |
| --- |
| Makeup VTO and AI Look VTO modules. Validates the effects[] array structure (pattern name requirements, palette count vs. colorNum, required texture sub-fields). Enforces the skin\_smooth default-50 override rule. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyMakeup** |

|  |
| --- |
| Calls /task/makeup-vto with the full effects array. Automatically inserts skin\_smooth with strength=50 if not present. Returns result image URL. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyLookVto** |

|  |
| --- |
| Calls /s2s/v1.0/task/mu-trans-rec for makeup transfer. Accepts headshot file\_id (src) and reference look file\_id (ref). Uses v1.0 RSA auth. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **validateEffects** |

|  |
| --- |
| Type-guards the effects array. Checks each category object against its schema (correct fields, palette count, texture sub-fields). Throws descriptive errors on mismatch. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/hair.ts** |

|  |
| --- |
| All five Hair API modules (v1.0 family). Implements the recommended chaining order: Style → Color → Extension → Bangs → Volume. Skips stages not present in the recipe and threads the previous stage's dst\_id forward. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **runHairPipeline** |

|  |
| --- |
| Accepts the hair object from the Recipe and the headshot file\_id. Executes active stages in the canonical order, threading dst\_id. Returns the final composited image URL. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHairStyle** |

|  |
| --- |
| Calls /s2s/v1.0/task/hair-style with style\_group\_id and style\_id. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHairColor** |

|  |
| --- |
| Calls /s2s/v1.0/task/hair-style with a Color-family style\_group\_id. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHairExtension** |

|  |
| --- |
| Calls /s2s/v1.0/task/hair-ext. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHairBangs** |

|  |
| --- |
| Calls /s2s/v1.0/task/hair-bang. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyHairVolume** |

|  |
| --- |
| Calls /s2s/v1.0/task/hair-vol. Always the last stage. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **fetchHairStyles** |

|  |
| --- |
| Paginates /task/style-group/<type> and /task/style/<type> endpoints. Returns a flat array of { id, title, thumbnailUrl } for the style picker UI. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/nails.ts** |

|  |
| --- |
| AI Nail VTO module. Handles the global vs. per-finger configuration split, custom texture upload flow, and sequential chaining for accent nail overrides. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyNails** |

|  |
| --- |
| Builds the nail\_config object from the Recipe nails section. Applies global config first, then processes any per-finger overrides with sequential task chaining. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/perfectcorp/modules/jewelry.ts** |

|  |
| --- |
| Ring, Bracelet, Watch, and Necklace VTO modules. All v2.0 Bearer. Implements dst\_id threading for ring stacking (multiple rings on different fingers) and bracelet stacking (multiple bracelets on the same wrist). |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyJewelry** |

|  |
| --- |
| Accepts the jewelry object from the Recipe. Runs Watch → Bracelet(s) → Ring(s) in order on the Hand/Wrist canvas (threading dst\_id), and Necklace independently on the Headshot canvas. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyRings** |

|  |
| --- |
| Iterates the rings array, applying each to the specified finger via dst\_id chaining. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **applyBracelets** |

|  |
| --- |
| Iterates the bracelets array, chaining each on the wrist result. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/pipeline/** |

|  |
| --- |
| Four canvas rendering pipelines. Each file orchestrates the full sequence of API calls for one canvas, combining module functions in the correct dependency order. These functions are called in parallel by Promise.allSettled() in the API task route. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/pipeline/headshot.ts** |

|  |
| --- |
| Headshot canvas pipeline. Sequence: Makeup VTO → Necklace VTO → Hair pipeline (Style→Color→Extension→Bangs→Volume) → Hat VTO. Handles the cross-family boundary between v2.0 (Necklace/Hat) and v1.0 (Hair): saves the v2.0 result to Vercel Blob and re-uploads as a v1.0 file since dst\_id namespaces are not shared. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **runHeadshotPipeline** |

|  |
| --- |
| Entry point. Accepts { recipe, headshotFileId }. Runs each stage in order, short-circuiting skipped stages. Emits progress events via the onProgress callback. Returns the final composited image URL. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/pipeline/fullbody.ts** |

|  |
| --- |
| Full Body canvas pipeline. Sequence: AI Clothes items (chained) → AI Bag. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **runFullBodyPipeline** |

|  |
| --- |
| Applies all wardrobe items sequentially via chainClothes, then applies the bag. Returns the final image URL. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/pipeline/handwrist.ts** |

|  |
| --- |
| Hand & Wrist canvas pipeline. Sequence: Watch → Bracelet(s) → Ring(s) → Nail VTO. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **runHandWristPipeline** |

|  |
| --- |
| Runs jewelry stages first (Watch → Bracelets → Rings), then overlays Nail VTO last to ensure nail art appears on top of all jewelry. Returns the final image URL. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/pipeline/feet.ts** |

|  |
| --- |
| Feet canvas pipeline. Single stage: AI Shoes. No chaining required. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **runFeetPipeline** |

|  |
| --- |
| Calls applyShoes with the Feet canvas file\_id and recipe wardrobe.shoes params. Returns the result image URL. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/storage/** |

|  |
| --- |
| Storage adapters for Vercel Blob (public image hosting) and Vercel KV (Redis-backed cache and queue). Both are server-only. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/storage/blob.ts** |

|  |
| --- |
| Vercel Blob adapter. Stores base photos and generated item images to obtain stable public URLs for Perfect Corp API requests. Manages the custom nail texture upload flow. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **BlobStorage** |

|  |
| --- |
| Wraps the @vercel/blob SDK. |

|  |  |
| --- | --- |
| **upload(filename, data)** | Stores a Buffer or File and returns a public HTTPS URL. Sets appropriate Content-Type and cache-control headers. |
| **delete(url)** | Removes a blob by its public URL. Called when a draft design is discarded. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/storage/kv.ts** |

|  |
| --- |
| Vercel KV (Redis) adapter. Used for: file\_id caching (SHA-256 keyed, 23h TTL), v1.0 access\_token caching (2h TTL), distributed mutex for token refresh, and per-user request queue management for rate limiting. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **KvCache** |

|  |
| --- |
| Typed Redis wrapper for all caching concerns. |

|  |  |
| --- | --- |
| **getFileId(cacheKey)** | Returns cached file\_id or null. |
| **setFileId(cacheKey, fileId)** | Stores file\_id with 23h expiry. |
| **getAccessToken()** | Returns cached v1.0 access\_token or null. |
| **setAccessToken(token, ttlSeconds)** | Stores access\_token. TTL is set to 7200s (2h) minus buffer. |
| **acquireLock(key, ttl)** | SET NX implementation for distributed mutex. Returns true if lock acquired. |
| **releaseLock(key)** | Deletes the lock key. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/validation/** |

|  |
| --- |
| Input validation and error normalisation. Runs on the server inside API routes before any upstream call is made. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/validation/upload.ts** |

|  |
| --- |
| Image upload validator. Checks canvas-specific constraints: resolution (long-side limits), file size (<10MB for canvases, <5MB for nail art/accessories), and accepted MIME types (image/jpeg, image/png). Decodes image dimensions from the file header without loading the full buffer into memory. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **ImageValidator** |

|  |
| --- |
| Static validation methods for each canvas type. |

|  |  |
| --- | --- |
| **validateHeadshot(file)** | Max 1920px long side, ≥100px face width check delegated to error\_face\_position\_too\_small from the API. |
| **validateFullBody(file)** | Max 2048px long side. |
| **validateHandWrist(file)** | Max 1500px long side. |
| **validateFeet(file)** | Max 1500px long side. |
| **validateAccessory(file)** | Max 5MB, 1024×1024 recommended. Used for ring/bag/shoe/hat reference photos and nail art textures. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/validation/errors.ts** |

|  |
| --- |
| Perfect Corp error code normaliser. Maps all known engine error codes to user-facing messages and retry strategies. Exported as a lookup table used by PerfectCorpClient and the API route error handlers. |

|  |  |
| --- | --- |
| **⬡ CLASS** | **ErrorNormaliser** |

|  |
| --- |
| Maps raw API error codes to { code, message, retryable, userFacingMessage }. |

|  |  |
| --- | --- |
| **normalise(rawError)** | Accepts the raw Perfect Corp error response. Returns a NormalisedError. Unknown codes are mapped to a generic "processing failed" message. |
| **ERROR\_MAP** | Static constant. Maps all 12 documented engine errors plus HTTP 400/401/429/500 to their client-side handling instructions as specified in Section 10.2 of the LLD. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **lib/recipe/** |

|  |
| --- |
| Recipe serialisation, deserialisation, and validation. Ensures that Recipe JSON saved to the database is always user-photo-free and schema-compliant. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/recipe/schema.ts** |

|  |
| --- |
| Zod schema definitions for the full Recipe JSON structure. Validates every nested object: wardrobe items, makeup effects (including per-category field requirements), hair style references, nail config, and jewelry arrays. Used both at save time (API route) and at load time (community try-on). |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **RecipeSchema** |

|  |
| --- |
| Top-level Zod schema. recipe\_id (uuid), schema\_version, created\_at, author\_id, and the five module sub-schemas. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **MakeupEffectSchema** |

|  |
| --- |
| Union discriminated by category. Validates per-category required fields (e.g., pattern.name for blush, morphology for lip\_color). |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **HairSchema** |

|  |
| --- |
| Nullable for each of the five hair stages. Requires style\_group\_id and style\_id when not null. |

|  |  |
| --- | --- |
| **📄 FILE** | **lib/recipe/serializer.ts** |

|  |
| --- |
| Converts the Zustand store recipe state to a plain Recipe JSON object ready for persistence. Strips any transient fields (task IDs, loading flags). Validates the output against RecipeSchema before returning. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **serialiseRecipe** |

|  |
| --- |
| Accepts the Zustand CharacterForgeStore recipe slice. Returns a validated Recipe JSON object or throws a ZodError. |

|  |  |
| --- | --- |
| **⬡ FUNCTION** | **deserialiseRecipe** |

|  |
| --- |
| Parses and validates a raw JSON object from the database. Returns a typed Recipe or throws on schema mismatch. |

# **4. /store — Zustand State Management**

Global client-side state is managed with Zustand. The store is split into slices but composed into a single store instance. State never leaves the browser — base photos (File objects) are never serialised or sent anywhere except through the explicit upload proxy call.

|  |  |
| --- | --- |
| **📄 FILE** | **store/characterforge.store.ts** |

|  |
| --- |
| Root Zustand store. Composes all slices (recipe, canvas, tasks) and exposes the top-level action triggerRender() which orchestrates the API calls for a given set of dirty modules. Uses immer middleware for immutable updates and devtools middleware for Redux DevTools integration. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **CharacterForgeStore** |

|  |
| --- |
| Combined store type. Merges RecipeSlice, CanvasSlice, and TaskSlice. |

|  |  |
| --- | --- |
| **triggerRender(modules)** | Dispatches pipeline runs for the specified modules. Marks affected canvases as processing. On completion, updates canvas current\_image\_url and appends to task\_history. |
| **publishRecipe()** | Serialises the current recipe via serialiseRecipe(), POSTs to /api/recipes, returns the recipe\_id. |
| **resetStudio()** | Clears all base photos, file\_ids, canvas states, and the recipe. Used when starting a new design. |

|  |  |
| --- | --- |
| **📄 FILE** | **store/canvas.slice.ts** |

|  |
| --- |
| Canvas state slice. Tracks the current rendered image URL, task history, and loading status for each of the four canvases. Used by the studio layout to render live-updating previews. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **CanvasSlice** |

|  |
| --- |
| State and actions for the four canvas states. |

|  |  |
| --- | --- |
| **canvases** | { headshot, fullbody, handwrist, feet } — each has current\_image\_url, task\_history[], and status (idle|uploading|processing|success|error). |
| **setCanvasStatus(canvas, status)** | Updates the TaskStatus for a single canvas. |
| **setCanvasImage(canvas, url)** | Updates current\_image\_url after a successful API result. |
| **appendTaskResult(canvas, result)** | Pushes a TaskResult to task\_history. Enables backward-navigation cache. |

|  |  |
| --- | --- |
| **📄 FILE** | **store/recipe.slice.ts** |

|  |
| --- |
| Recipe slice. Holds the full Recipe object being built. All module pages write into this slice via typed setter actions. Tracks dirty state to determine which pipelines need re-running when settings change. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **RecipeSlice** |

|  |
| --- |
| State and actions for the recipe under construction. |

|  |  |
| --- | --- |
| **recipe** | The full Recipe object (wardrobe, makeup, hair, nails, jewelry). |
| **dirtyModules** | Set<string> of module names that have changed since last render. |
| **updateRecipe(path, value)** | Immer-based deep setter. Marks the affected module as dirty. |
| **applyMakeupEffect(effect)** | Upserts an effect into recipe.makeup.effects[] by category. Marks makeup as dirty. |
| **clearDirty(modules)** | Removes module names from dirtyModules after a successful render. |

# **5. /components — React UI Components**

Reusable React components. Divided into three groups: canvas display components, studio module panels, and shared utility components.

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/canvas/** |

|  |
| --- |
| The four live-updating canvas preview components displayed in the studio layout sidebar. Each subscribes to its slice of Zustand CanvasState and shows the current rendered image, a progress skeleton during processing, or the original base photo while idle. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/canvas/HeadshotCanvas.tsx** |

|  |
| --- |
| Headshot canvas preview. Renders the current\_image\_url for the headshot canvas. Shows an animated skeleton overlay during API processing. Displays the original uploaded photo when no render has run yet. Includes the SFX overlay compositing layer (HTML5 Canvas blend mode) for skin texture effects. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/canvas/FullBodyCanvas.tsx** |

|  |
| --- |
| Full Body canvas preview. Same pattern as HeadshotCanvas. Aspect ratio locked to portrait 3:4. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/canvas/HandWristCanvas.tsx** |

|  |
| --- |
| Hand & Wrist canvas preview. Square aspect ratio. Shows the HandMapSelector SVG overlay when the Nails module is active. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/canvas/FeetCanvas.tsx** |

|  |
| --- |
| Feet canvas preview. Landscape-cropped display focused on the foot region. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/studio/** |

|  |
| --- |
| Module-specific UI panels. Each subfolder contains the components for one studio module. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/studio/wardrobe/** |

|  |
| --- |
| Wardrobe module components. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/wardrobe/PromptInput.tsx** |

|  |
| --- |
| Text prompt input for the AI Image Generator. Includes a garment type selector dropdown (upper\_body / lower\_body / dresses / full\_body) and a "Generate" button. Shows a loading spinner while the image-gen task runs and displays the result as a small preview card. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/wardrobe/GarmentCard.tsx** |

|  |
| --- |
| Preview card for a generated garment item. Shows the white-background isolated image, the prompt text, and a remove button. Supports drag-to-reorder for controlling the chain try-on sequence. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/wardrobe/AccessoryUploader.tsx** |

|  |
| --- |
| Reference photo upload slots for Hat, Bag, Shoes accessories. Validates the uploaded file against ImageValidator.validateAccessory() before adding to the recipe. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/studio/makeup/** |

|  |
| --- |
| Makeup module components. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/makeup/MakeupEffectPanel.tsx** |

|  |
| --- |
| Container for a single makeup category. Renders a collapsible card with the category name. Dynamically renders the appropriate sub-panel based on category. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/makeup/ColorPicker.tsx** |

|  |
| --- |
| HSL colour picker with a hex input. Emits colour changes debounced at 300ms to avoid triggering an API call on every mouse move. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/makeup/PatternSelector.tsx** |

|  |
| --- |
| Grid of pattern thumbnails loaded from the makeup catalog JSON files (blush.json, contour.json, etc.). Calls /api/styles/<category> to fetch thumbnails. Highlights the selected pattern. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/makeup/IntensitySlider.tsx** |

|  |
| --- |
| Reusable 0–100 range slider with a numeric label. Used for colorIntensity, glowIntensity, coverageIntensity, and all other makeup intensity parameters. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/makeup/TextureSelector.tsx** |

|  |
| --- |
| Segmented control for texture selection (matte / satin / shimmer / gloss / metallic / holographic / sheer). Conditionally shows the shimmerColor picker and shimmerDensity slider when shimmer is selected. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/studio/hair/** |

|  |
| --- |
| Hair module components. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/hair/StyleGroupGrid.tsx** |

|  |
| --- |
| Paginated grid of hair style thumbnails for a given API type (hair-style, hair-color, hair-ext, hair-bang, hair-vol). Fetches style groups and styles from the proxy-cached discovery endpoints. Renders a thumbnail grid with the style title below each image. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/hair/HairPipelinePreview.tsx** |

|  |
| --- |
| Visual diagram showing the active hair pipeline stages in order. Each active stage is shown as a coloured chip connected by arrows. Inactive stages are greyed out. Helps the user understand the processing order. |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/studio/nails/** |

|  |
| --- |
| Nail and jewelry module components. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/nails/HandMapSelector.tsx** |

|  |
| --- |
| SVG interactive hand diagram. Five finger regions are click-targets. Clicking a finger sets apply\_to to that finger name in the Zustand recipe. A "Select All" button sets apply\_to: "all". Highlights the currently active finger. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/nails/NailConfigPanel.tsx** |

|  |
| --- |
| Nail configuration panel. Contains colour picker, texture segmented control (matte/gloss/glitter/chrome/custom), shape selector (square/round/oval/stiletto/coffin), intensity slider, and the custom texture file upload slot. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/studio/nails/JewelryPanel.tsx** |

|  |
| --- |
| Unified jewelry configuration panel with four tabs: Ring, Bracelet, Watch, Necklace. Each tab contains a reference photo uploader and the relevant parameter controls (finger selector for Ring, wrist selector for Bracelet and Watch). |

|  |  |
| --- | --- |
| **📁 FOLDER** | **components/shared/** |

|  |
| --- |
| Utility components used across multiple modules. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/shared/PhotoUploader.tsx** |

|  |
| --- |
| Generic file drop zone with click-to-browse. Validates MIME type and file size on the client before accepting. Shows an image preview thumbnail on success and a red error banner on validation failure. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/shared/TaskProgress.tsx** |

|  |
| --- |
| SSE-connected progress indicator. Connects to the /api/perfectcorp/[module]/task SSE stream for a given task. Renders a progress bar and status label (Uploading → Processing → Complete). Switches to an error state on normalised error events. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/shared/RecipeCard.tsx** |

|  |
| --- |
| Community feed card. Shows the four-pane composite preview (two rows × two columns thumbnail grid), the author's display name, the creation date, and a "Try On" button that navigates to /community/[recipe\_id]. |

|  |  |
| --- | --- |
| **📄 FILE** | **components/shared/SfxOverlay.tsx** |

|  |
| --- |
| HTML5 Canvas compositing layer for SFX skin textures. Renders a PNG texture asset above the Headshot canvas using CSS mix-blend-mode: multiply at a user-adjustable opacity (0–100). Not a Perfect Corp API call — client-side only. |

# **6. /types — TypeScript Type Definitions**

Shared TypeScript interfaces and types. Imported by both server (lib/) and client (components/, store/) code.

|  |  |
| --- | --- |
| **📄 FILE** | **types/recipe.ts** |

|  |
| --- |
| Complete Recipe type hierarchy. Mirrors the Recipe JSON schema from Section 8 of the LLD. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **Recipe** |

|  |
| --- |
| Top-level recipe object with recipe\_id, schema\_version, created\_at, author\_id, and the five module objects. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **WardrobeConfig** |

|  |
| --- |
| items[], bag, shoes, hat. Each item has item\_id, type (garment\_category), prompt, generated\_image\_url, change\_shoes. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **MakeupConfig** |

|  |
| --- |
| type ("custom"|"preset"), preset\_ref\_url, effects: MakeupEffect[]. |

|  |  |
| --- | --- |
| **⬡ TYPE** | **MakeupEffect** |

|  |
| --- |
| Discriminated union by category. One member per makeup category (Foundation, Concealer, Blush, …, SkinSmooth). Each member type carries its category-specific fields. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **HairConfig** |

|  |
| --- |
| Five nullable stage objects (style, color, extension, bangs, volume). Each stage has style\_group\_id, style\_id, and title. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **NailsConfig** |

|  |
| --- |
| global nail config + optional overrides map keyed by finger name. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **JewelryConfig** |

|  |
| --- |
| rings[], bracelets[], watch, necklace. Each has ref\_image\_url and appropriate positional param (finger, wrist). |

|  |  |
| --- | --- |
| **📄 FILE** | **types/perfectcorp.ts** |

|  |
| --- |
| Types for Perfect Corp API request and response shapes. |

|  |  |
| --- | --- |
| **⬡ TYPE** | **TaskStatus** |

|  |
| --- |
| "idle" | "uploading" | "processing" | "success" | "error" |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **TaskResult** |

|  |
| --- |
| task\_id, task\_status, result\_url (optional), polling\_interval, error (optional NormalisedError). |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **NormalisedError** |

|  |
| --- |
| code (string), message (string), retryable (boolean), userFacingMessage (string). |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **FileUploadResponse** |

|  |
| --- |
| file\_id, upload\_url (pre-signed S3), expiry. |

|  |  |
| --- | --- |
| **⬡ TYPE** | **ApiFamily** |

|  |
| --- |
| "v1" | "v2" — used to route requests to the correct base URL and auth header. |

|  |  |
| --- | --- |
| **📄 FILE** | **types/canvas.ts** |

|  |
| --- |
| Canvas and studio state types. |

|  |  |
| --- | --- |
| **⬡ TYPE** | **CanvasKey** |

|  |
| --- |
| "headshot" | "fullbody" | "handwrist" | "feet" |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **CanvasState** |

|  |
| --- |
| current\_image\_url, task\_history: TaskResult[], status: TaskStatus. One instance per canvas. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **BasePhotos** |

|  |
| --- |
| headshot, fullbody, handwrist, feet — all File | null. Never serialised or sent outside the browser. |

|  |  |
| --- | --- |
| **⬡ INTERFACE** | **FileIds** |

|  |
| --- |
| Proxy-returned file\_ids for each uploaded base photo. Used in API calls in place of re-uploading. |

# **7. /constants — Configuration Constants**

|  |  |
| --- | --- |
| **📄 FILE** | **constants/api-modules.ts** |

|  |
| --- |
| Maps every Perfect Corp module slug to its configuration: base URL family (v1/v2), file endpoint path, task endpoint path, poll endpoint path, source canvas, and Recipe storage key. Single source of truth — used by PerfectCorpClient to route requests correctly. |

|  |  |
| --- | --- |
| **⬡ ENUM** | **MODULE\_CONFIG** |

|  |
| --- |
| Record<ModuleSlug, ModuleConfig>. Covers all 17 module slugs. ModuleConfig has: baseUrl, authFamily, fileEndpoint, taskEndpoint, pollEndpoint, sourceCanvas, recipeKey. |

|  |  |
| --- | --- |
| **📄 FILE** | **constants/error-codes.ts** |

|  |
| --- |
| Enumerates all known Perfect Corp engine error codes as string constants. Used by ErrorNormaliser to build the ERROR\_MAP without magic strings. |

|  |  |
| --- | --- |
| **⬡ ENUM** | **PcErrorCode** |

|  |
| --- |
| String enum: FACE\_POSITION\_INVALID, FACE\_POSITION\_TOO\_SMALL, FACE\_ANGLE\_INVALID, LARGE\_FACE\_ANGLE, NO\_FACE, NO\_SHOULDER, MULTIPLE\_PEOPLE, EXCEED\_MAX\_FILESIZE, NSFW\_DETECTED, CREDIT\_INSUFFICIENCY, INVALID\_API\_KEY, TASK\_TIMEOUT — matching the 12 codes documented in LLD Section 10.2. |

# **8. Full Directory Tree Reference**

Complete annotated file tree for quick navigation.

|  |  |
| --- | --- |
| **characterforge/** |  |

|  |  |
| --- | --- |
| **├─ app/** | Next.js App Router root |

|  |  |
| --- | --- |
| │ ├─ layout.tsx | Root HTML shell, providers |

|  |  |
| --- | --- |
| │ ├─ page.tsx | Landing page |

|  |  |
| --- | --- |
| │ ├─ global.css | CSS custom properties & resets |

|  |  |
| --- | --- |
| **│ ├─ studio/** | Design studio route group |

|  |  |
| --- | --- |
| │ │ ├─ layout.tsx | Four-pane preview + module nav |

|  |  |
| --- | --- |
| │ │ ├─ page.tsx | Redirect to /upload or /wardrobe |

|  |  |
| --- | --- |
| │ │ ├─ upload/page.tsx | Four-slot photo upload wizard |

|  |  |
| --- | --- |
| │ │ ├─ wardrobe/page.tsx | Module A — Wardrobe & Accessories |

|  |  |
| --- | --- |
| │ │ ├─ makeup/page.tsx | Module B — Makeup Studio |

|  |  |
| --- | --- |
| │ │ ├─ hair/page.tsx | Module C — Hair Styling |

|  |  |
| --- | --- |
| │ │ └─ nails/page.tsx | Module D — Nails & Jewelry |

|  |  |
| --- | --- |
| **│ ├─ community/** | Community feed routes |

|  |  |
| --- | --- |
| │ │ ├─ page.tsx | Recipe browse grid |

|  |  |
| --- | --- |
| │ │ └─ [recipe\_id]/page.tsx | Recipe try-on page |

|  |  |
| --- | --- |
| **│ └─ api/** | Serverless API proxy |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/[module]/file/route.ts | File upload proxy (POST) |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/[module]/task/route.ts | Task dispatch + SSE poll (POST) |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/[module]/task/[id]/route.ts | Manual status check (GET) |

|  |  |
| --- | --- |
| │ ├─ auth/v1/route.ts | v1.0 RSA token exchange |

|  |  |
| --- | --- |
| │ ├─ recipes/route.ts | Recipe CRUD (GET / POST) |

|  |  |
| --- | --- |
| │ └─ recipes/[recipe\_id]/route.ts | Single recipe (GET/PATCH/DELETE) |

|  |  |
| --- | --- |
| **├─ lib/** | Server-only business logic |

|  |  |
| --- | --- |
| │ ├─ auth/v2-bearer.ts | Bearer header provider |

|  |  |
| --- | --- |
| │ ├─ auth/v1-rsa.ts | RSA token manager + mutex |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/client.ts | Base HTTP client + backoff |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/poller.ts | Async task poll orchestrator |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/image-gen.ts | Image Generator API |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/wardrobe.ts | Clothes / Hat / Bag / Shoes APIs |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/makeup.ts | Makeup VTO + Look VTO APIs |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/hair.ts | All five Hair APIs + pipeline |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/nails.ts | Nail VTO API |

|  |  |
| --- | --- |
| │ ├─ perfectcorp/modules/jewelry.ts | Ring / Bracelet / Watch / Necklace APIs |

|  |  |
| --- | --- |
| │ ├─ pipeline/headshot.ts | Headshot rendering pipeline |

|  |  |
| --- | --- |
| │ ├─ pipeline/fullbody.ts | Full Body rendering pipeline |

|  |  |
| --- | --- |
| │ ├─ pipeline/handwrist.ts | Hand & Wrist rendering pipeline |

|  |  |
| --- | --- |
| │ ├─ pipeline/feet.ts | Feet rendering pipeline |

|  |  |
| --- | --- |
| │ ├─ storage/blob.ts | Vercel Blob adapter |

|  |  |
| --- | --- |
| │ ├─ storage/kv.ts | Vercel KV (Redis) adapter |

|  |  |
| --- | --- |
| │ ├─ validation/upload.ts | Image upload validator |

|  |  |
| --- | --- |
| │ ├─ validation/errors.ts | Error code normaliser |

|  |  |
| --- | --- |
| │ ├─ recipe/schema.ts | Zod Recipe schema |

|  |  |
| --- | --- |
| │ └─ recipe/serializer.ts | Recipe serialise / deserialise |

|  |  |
| --- | --- |
| **├─ store/** | Zustand client state |

|  |  |
| --- | --- |
| │ ├─ characterforge.store.ts | Root store + triggerRender |

|  |  |
| --- | --- |
| │ ├─ canvas.slice.ts | Canvas state slice |

|  |  |
| --- | --- |
| │ └─ recipe.slice.ts | Recipe + dirty-tracking slice |

|  |  |
| --- | --- |
| **├─ components/** | React UI components |

|  |  |
| --- | --- |
| │ ├─ canvas/HeadshotCanvas.tsx | Headshot preview + SFX overlay |

|  |  |
| --- | --- |
| │ ├─ canvas/FullBodyCanvas.tsx | Full Body preview |

|  |  |
| --- | --- |
| │ ├─ canvas/HandWristCanvas.tsx | Hand & Wrist preview |

|  |  |
| --- | --- |
| │ ├─ canvas/FeetCanvas.tsx | Feet preview |

|  |  |
| --- | --- |
| │ ├─ studio/wardrobe/PromptInput.tsx | AI Image Generator prompt UI |

|  |  |
| --- | --- |
| │ ├─ studio/wardrobe/GarmentCard.tsx | Generated item preview card |

|  |  |
| --- | --- |
| │ ├─ studio/wardrobe/AccessoryUploader.tsx | Hat / Bag / Shoes reference upload |

|  |  |
| --- | --- |
| │ ├─ studio/makeup/MakeupEffectPanel.tsx | Per-category makeup container |

|  |  |
| --- | --- |
| │ ├─ studio/makeup/ColorPicker.tsx | HSL + hex colour picker |

|  |  |
| --- | --- |
| │ ├─ studio/makeup/PatternSelector.tsx | Pattern thumbnail grid |

|  |  |
| --- | --- |
| │ ├─ studio/makeup/IntensitySlider.tsx | 0–100 range slider |

|  |  |
| --- | --- |
| │ ├─ studio/makeup/TextureSelector.tsx | Texture segmented control |

|  |  |
| --- | --- |
| │ ├─ studio/hair/StyleGroupGrid.tsx | Hair style thumbnail grid |

|  |  |
| --- | --- |
| │ ├─ studio/hair/HairPipelinePreview.tsx | Pipeline stage diagram |

|  |  |
| --- | --- |
| │ ├─ studio/nails/HandMapSelector.tsx | SVG finger selection diagram |

|  |  |
| --- | --- |
| │ ├─ studio/nails/NailConfigPanel.tsx | Nail colour / texture / shape |

|  |  |
| --- | --- |
| │ ├─ studio/nails/JewelryPanel.tsx | Ring / Bracelet / Watch / Necklace tabs |

|  |  |
| --- | --- |
| │ ├─ shared/PhotoUploader.tsx | Generic file drop zone |

|  |  |
| --- | --- |
| │ ├─ shared/TaskProgress.tsx | SSE-connected progress bar |

|  |  |
| --- | --- |
| │ ├─ shared/RecipeCard.tsx | Community feed card |

|  |  |
| --- | --- |
| │ └─ shared/SfxOverlay.tsx | HTML5 Canvas SFX compositing |

|  |  |
| --- | --- |
| **├─ types/** | Shared TypeScript types |

|  |  |
| --- | --- |
| │ ├─ recipe.ts | Recipe + sub-config interfaces |

|  |  |
| --- | --- |
| │ ├─ perfectcorp.ts | API request / response types |

|  |  |
| --- | --- |
| │ └─ canvas.ts | Canvas state types |

|  |  |
| --- | --- |
| **└─ constants/** | Configuration constants |

|  |  |
| --- | --- |
| ├─ api-modules.ts | MODULE\_CONFIG — all 17 modules |

|  |  |
| --- | --- |
| └─ error-codes.ts | PcErrorCode string enum |

*CharacterForge — File System Architecture Reference | v1.0 | May 2026 | Confidential*