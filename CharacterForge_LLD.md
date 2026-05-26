**CharacterForge**

Low-Level System Design Document

*Perfect Corp API Integration Specification*

|  |  |
| --- | --- |
| **Version** | 1.0.0 |
| **Date** | May 2026 |
| **APIs Covered** | 16 Perfect Corp APIs |
| **Platform** | Next.js / Vercel |

# **1. System Architecture Overview**

CharacterForge integrates 16 Perfect Corp AI APIs across two API families. All API calls are routed through a serverless proxy to protect credentials. The frontend never calls Perfect Corp directly.

## **1.1 API Family Classification**

Perfect Corp maintains two distinct API surfaces with different authentication protocols and base URLs:

|  |  |  |  |
| --- | --- | --- | --- |
| **Family** | **Base URL** | **Auth Method** | **API Modules Covered** |
| v2.0 (S2S) | https://yce-api-01.makeupar.com | Bearer <API\_KEY> (direct) | Makeup VTO, Look VTO, Nail VTO, Clothes, Hat, Bag, Shoes, Ring, Bracelet, Watch, Necklace, Image Generator |
| v1.0 (Legacy) | https://yce-api-01.perfectcorp.com | RSA-encrypted access\_token | AI Hairstyle, Hair Color, Hair Extension, Hair Bangs, Hair Volume |

## **1.2 Universal Async Task Pattern**

Every API, regardless of family, follows the same three-step asynchronous task lifecycle:

1. **Upload Phase:** Call the file endpoint (e.g. POST /s2s/v2.0/file/makeup-vto) to obtain a pre-signed S3 upload URL and a file\_id. PUT the image binary directly to that URL.
2. **Dispatch Phase:** POST to the task endpoint with the file\_id and parameters. Receive a task\_id immediately. No processing has started yet - the server returns the ID synchronously.
3. **Poll Phase:** GET the task status endpoint on the polling\_interval returned (typically every 500 ms). Poll until task\_status is 'success' or 'error'. Result image URL is valid for 2 hours. Credits are only consumed on success.

|  |
| --- |
| **CRITICAL:** |

## **1.3 Serverless Proxy Architecture**

All 16 Perfect Corp API calls are routed through Next.js API Routes deployed on Vercel. The proxy handles:

* **Credential Injection:** Bearer token and RSA-signed id\_token injected server-side only.
* **Public URL Construction:** User base photos must be publicly accessible. The proxy stores uploaded photos in Vercel Blob Storage and passes the public URL to Perfect Corp.
* **Polling Orchestration:** Server-Side Events (SSE) stream polling updates back to the client so the UI can show real-time progress.
* **Error Normalisation:** All Perfect Corp engine errors are normalized into a consistent {code, message, retryable} shape before reaching the client.
* **Rate Limit Management:** Per-IP limit: 100 req / 5 min. Per-token limit: 100 req / min. The proxy queues requests and implements exponential backoff on 429 responses.

// Proxy route structure (Next.js App Router)
POST /api/perfectcorp/[module]/file → upload file, return file\_id
POST /api/perfectcorp/[module]/task → start task, begin SSE poll
GET /api/perfectcorp/[module]/task/[id]→ manual status check (fallback)
// Module values: makeup-vto | ai-look-vto | nail-vto | cloth | hat
// bag | shoes | ring | bracelet | watch | necklace
// hair-style | hair-color | hair-ext | hair-bang | hair-vol
// image-gen

## **1.4 Four Canvas Images & API Routing**

Each of the four base photos the user uploads is the source for a specific subset of APIs. The following table maps base images to their consumer APIs:

|  |  |  |
| --- | --- | --- |
| **Canvas** | **Base Image Requirements** | **APIs Applied To This Canvas** |
| Headshot | Face-forward, well-lit. long side < 1920px, face width >= 100px, < 10MB, JPG/PNG | Makeup VTO, AI Look VTO, Hair Style, Hair Color, Hair Ext, Hair Bangs, Hair Volume, AI Hat, AI Necklace (v2.0) |
| Full Body | Full standing pose, shoulders visible. long side < 2048px, < 10MB, JPG/PNG | AI Clothes, AI Bag |
| Hand & Wrist | Palm-up or dorsal, flat. long side <= 1500px, < 10MB, JPG/PNG | AI Nail VTO, Ring VTO, AI Bracelet, AI Watch |
| Feet | Straight-on, both feet visible. long side <= 1500px, < 10MB, JPG/PNG | AI Shoes |

# **2. Authentication Design**

## **2.1 v2.0 Bearer Authentication (Makeup, Fashion, Nail, Image Generator)**

The newer Perfect Corp APIs (docs.perfectcorp.com) use a static API key as a Bearer token. No token exchange or expiry management is required on the client side.

// Server-side only - stored in Vercel environment variable
const PERFECTCORP\_V2\_API\_KEY = process.env.PERFECTCORP\_V2\_API\_KEY;
const headers = {
"Content-Type": "application/json",
"Authorization": `Bearer ${PERFECTCORP\_V2\_API\_KEY}`
};

## **2.2 v1.0 RSA Authentication (Hair APIs)**

The legacy Hair API family requires a time-stamped, RSA-encrypted id\_token exchanged for a 2-hour access\_token.

// Step 1: Construct plaintext payload
const timestamp = Date.now(); // milliseconds
const plaintext = `client\_id=${CLIENT\_ID}&timestamp=${timestamp}`;
// Step 2: RSA-encrypt with Base64-encoded X.509 client\_secret
const encrypted = rsaEncrypt(plaintext, base64Decode(CLIENT\_SECRET));
const id\_token = Buffer.from(encrypted).toString('base64');
// Step 3: Exchange for access\_token
const resp = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth', {
method: 'POST',
body: JSON.stringify({ client\_id: CLIENT\_ID, id\_token }),
});
const { result: { access\_token } } = await resp.json();
// access\_token is valid for 2 hours - cache and reuse

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Token Lifetime | 2 hours from issue |
| Cache Strategy | Store access\_token in server memory. Refresh 5 min before expiry using a background cron job (Vercel Cron). |
| Concurrency | Token refresh must use a mutex to prevent duplicate auth calls during concurrent requests. |
| Error on Expiry | 401 InvalidApiKey - invalidate cache, re-authenticate, retry request once. |

# **3. Module A: Wardrobe & Accessories APIs**

## **3.1 AI Image Generator - Isolated Item Generation**

Before any try-on can occur, wardrobe items must be generated as isolated images on pure white backgrounds. This is accomplished via the Image Generator API.

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Endpoint (Task) | POST /s2s/v2.0/task/image-gen |
| Style Discovery | GET /s2s/v1.0/task/style-group/image-gen → GET /s2s/v1.0/task/style/image-gen |
| Auth Family | v2.0 Bearer |
| Input | text prompt string + style\_group\_id + style\_id |
| Output Image | Generated item on white background, 1024×1024 max, JPG |
| Constraints | Prompt: describe the garment or accessory in plain English. Style ID: select 'white background product' style group for clean try-on source images. |

// Request body - AI Image Generator
{
"request\_id": 1,
"payload": {
"actions": [{
"id": 0,
"params": {
"style\_group\_id": <product\_style\_group\_id>,
"style\_ids": [<white\_bg\_style\_id>],
"prompt": "Cyberpunk leather jacket with neon blue accents, front view"
}
}]
}
}

**Parallel Generation:** When the user submits multiple item prompts, the proxy fans out all image-gen task POSTs simultaneously using Promise.allSettled(), then polls each task\_id independently. The frontend receives a stream of results as each item resolves.

## **3.2 AI Clothes Try-On**

Applies a generated or reference clothing item onto the Full Body Canvas photo.

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v2.0/file/cloth |
| Task Endpoint | POST /s2s/v2.0/task/cloth |
| Poll Endpoint | GET /s2s/v2.0/task/cloth/<task\_id> |
| Auth Family | v2.0 Bearer |
| src image | Full Body photo (file\_id or public URL) |
| ref image | Generated clothing item on white background (file\_id or public URL) |
| garment\_category | Enum: 'upper\_body' | 'lower\_body' | 'dresses' | 'full\_body'. Must match item type. |
| change\_shoes | Boolean. Set true only when applying full-body outfit that includes footwear. |
| Image Constraints | long side <= 2048px, short side <= 1024px, < 10MB, JPG/PNG. Person must have shoulders visible. |

// Chain try-on request body
{
"src\_file\_url": "<full\_body\_public\_url>",
"ref\_file\_url": "<generated\_garment\_white\_bg\_url>",
"garment\_category": "upper\_body",
"change\_shoes": false,
"gender": "female"
}

**Chain Try-On Sequence:** When applying multiple garments (e.g., shirt → jacket → belt), the dst\_id output of each completed task is passed as the src\_ids for the next task. This avoids re-uploading and re-processing intermediate images.

// Chain pattern - reuse dst\_id as next src
const step1 = await pollTask({ module: 'cloth', taskId: shirt\_task\_id });
const shirt\_dst\_id = step1.result.results[0].data[0].dst\_id;
// jacket applied on top of shirt result
await startTask({ module: 'cloth', src\_id: shirt\_dst\_id, ref\_id: jacket\_file\_id, ... });

## **3.3 AI Hat VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/hat |
| Source Image | Headshot Canvas (file\_id or URL) |
| Reference Image | Hat product image - isolated on white or natural background |
| Key Parameters | No garment\_category needed. API auto-detects head position and places hat naturally. |
| Image Constraints | long side < 1920px, face width >= 100px, < 10MB, JPG/PNG |

## **3.4 AI Bag VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/bag |
| Source Image | Full Body Canvas |
| Reference Image | Bag product image (official product photo recommended) |
| gender | Required. Enum: 'female' | 'male'. Affects placement logic (hand position, strap angle). |
| Image Constraints | Full body with arms visible, < 10MB, JPG/PNG |

## **3.5 AI Shoes VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/shoes |
| Source Image | Feet Canvas |
| Reference Image | Shoe product image, ideally a clean studio photo |
| gender | Required. Enum: 'female' | 'male'. |
| Image Constraints | Both feet visible, straight-on angle, < 10MB, JPG/PNG |

# **4. Module B: Makeup Studio API**

## **4.1 AI Makeup VTO - Overview**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v2.0/file/makeup-vto |
| Task Endpoint | POST /s2s/v2.0/task/makeup-vto |
| Poll Endpoint | GET /s2s/v2.0/task/makeup-vto/<task\_id> |
| Auth Family | v2.0 Bearer |
| Source Image | Headshot Canvas |
| Payload version | version: 1.0 - always include this field |
| Image Constraints | long side < 1920px, face width >= 100px, < 10MB, JPG/JPEG/PNG |

**Incremental Updates:** Each time the user adjusts a makeup parameter, the frontend sends a full effects[] array containing all currently configured effects. The API always applies the full stack from scratch against the original Headshot Canvas - not incrementally.

**Skin Smooth Default:** If no skin\_smooth effect is included, the API auto-applies a default value of 50. To disable smoothing, explicitly set skinSmoothStrength: 0 and skinSmoothColorIntensity: 0 in the effects array.

## **4.2 Makeup Effect Category Schemas**

The following section defines the exact JSON schema for each makeup category supported in the effects[] array.

### **4.2.1 Foundation**

{ "category": "foundation",
"palettes": [{
"color": "#F5D0A9", // hex skin-match color
"colorIntensity": 50, // 0-100
"glowIntensity": 30, // 0-100
"coverageIntensity": 60 // 0-100
}]
}

### **4.2.2 Concealer**

{ "category": "concealer",
"palettes": [{
"color": "#F0C8A0",
"colorIntensity": 50,
"colorUnderEyeIntensity": 60, // 0-100 - extra coverage under eye
"coverageLevel": 70 // 0-100
}]
}

### **4.2.3 Blush**

Requires a pattern.name from the blush.json catalog (e.g. '1color1', '2colors6'). Number of palette entries must match the pattern's colorNum.

{ "category": "blush",
"pattern": { "name": "2colors6" },
"palettes": [
{ "color": "#FF6B8A", "texture": "matte", "colorIntensity": 50 },
{ "color": "#F2A53E", "texture": "satin", "glowStrength": 40, "colorIntensity": 45 }
]
}
// texture: 'matte' | 'satin' | 'shimmer'
// glowStrength required when texture='satin'
// shimmerColor + shimmerDensity required when texture='shimmer'

### **4.2.4 Bronzer**

{ "category": "bronzer",
"pattern": { "name": "Bronzer1" }, // from bronzer.json
"palettes": [{ "color": "#A0522D", "colorIntensity": 40 }]
}

### **4.2.5 Contour**

Pattern name must come from contour.json - face-shape specific: e.g. OvalFace6, RoundFace4, HeartFace2.

{ "category": "contour",
"pattern": { "name": "OvalFace6" },
"palettes": [{ "color": "#8B6358", "colorIntensity": 45 }]
}

### **4.2.6 Highlighter**

Pattern name from highlighter.json. Supports shimmer/glow parameters.

{ "category": "highlighter",
"pattern": { "name": "OvalFace2" },
"palettes": [{
"color": "#FFD700",
"glowIntensity": 60,
"shimmerIntensity": 70,
"shimmerDensity": 50,
"shimmerSize": 40,
"colorIntensity": 55
}]
}

### **4.2.7 Eyebrows**

Two modes: "type": "shape" (reshapes brow) or "type": "color" (recolors only). Shape names from eyebrows.json.

// Shape mode
{ "category": "eyebrows",
"pattern": {
"type": "shape",
"name": "SoftArch1",
"curvature": 10, // -100 to 100
"thickness": 5, // -100 to 100
"definition": 60 // 0 to 100
},
"palettes": [{ "color": "#3B2314", "texture": "matte", "colorIntensity": 80 }]
}

### **4.2.8 Eye Shadow**

Pattern from eyeshadow.json. 1-5 color palettes depending on the chosen pattern's colorNum. Supports matte/shimmer/metallic textures.

{ "category": "eye\_shadow",
"pattern": { "name": "3colors1" },
"palettes": [
{ "color": "#8B0000", "texture": "matte", "colorIntensity": 70 },
{ "color": "#4B0082", "texture": "shimmer", "shimmerColor": "#9400D3",
"shimmerIntensity": 60, "colorIntensity": 60 },
{ "color": "#000000", "texture": "matte", "colorIntensity": 80 }
]
}

### **4.2.9 Eye Liner**

Pattern from eyeliner.json. Supports matte/shimmer/metallic.

{ "category": "eye\_liner",
"pattern": { "name": "Arabic3" },
"palettes": [{ "color": "#000000", "texture": "matte", "colorIntensity": 90 }]
}

### **4.2.10 Eyelashes / Mascara**

Pattern from eyelashes.json (e.g. 'Natural1', 'UpperDense1', 'Winged1').

{ "category": "eyelashes",
"pattern": { "name": "UpperDense1" },
"palettes": [{ "color": "#0A0A0A", "colorIntensity": 85 }]
}

### **4.2.11 Lip Color**

Most complex makeup effect. Requires shape (lipshape.json), style.type (full/ombre/twoTone), and morphology for reshaping. 7 texture options.

{ "category": "lip\_color",
"shape": { "name": "plump" }, // from lipshape.json
"morphology": { "fullness": 30, "wrinkless": 20 },
"style": { "type": "full" }, // or "ombre" (add innerRatio, featherStrength)
"palettes": [{
"color": "#C0392B",
"texture": "gloss", // matte|gloss|holographic|metallic|satin|sheer|shimmer
"colorIntensity": 80,
"gloss": 70, // required for gloss|holographic|metallic|sheer|shimmer
"transparencyIntensity": 30 // required for gloss|sheer|shimmer
}]
}

### **4.2.12 Lip Liner**

{ "category": "lip\_liner",
"pattern": { "name": "Natural1" }, // from lipliner.json
"palettes": [{
"color": "#A0522D",
"texture": "matte", // or "satin"
"colorIntensity": 70,
"thickness": 40, // 0-100
"smoothness": 60 // 0-100
}]
}

### **4.2.13 Skin Smooth**

{ "category": "skin\_smooth",
"skinSmoothStrength": 55, // 0-100 (default 50 if omitted)
"skinSmoothColorIntensity": 45 // 0-100
}

## **4.3 AI Look VTO (Makeup Transfer)**

Transfers the full makeup look from a reference photo to the Headshot Canvas. Used for the CharacterForge preset system.

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint (v1.0) | POST /s2s/v1.0/file/mu-trans-rec |
| Task Endpoint (v1.0) | POST /s2s/v1.0/task/mu-trans-rec |
| Auth Family | v1.0 RSA access\_token |
| src\_ids | Headshot Canvas file\_id (the target face) |
| ref\_ids | Reference look photo file\_id (the makeup to extract and apply) |
| Image Constraints | long side <= 1024px, < 10MB, JPG/PNG/HEIC (both images) |
| Use Case | Saving a preset: store reference image URL in Recipe. On community try-on, use the viewer's headshot as src and the preset reference as ref. |

## **4.4 SFX / Skin Textures**

SFX effects (wounds, scales, prosthetic skin textures) are applied via a custom texture overlay on the Headshot Canvas. CharacterForge implements this as a supplementary client-side compositing layer using HTML5 Canvas API, not a Perfect Corp endpoint, since Perfect Corp does not expose a dedicated SFX API. The overlay uses CSS mix-blend-mode: multiply at adjustable opacity.

# **5. Module C: Hair Styling APIs**

All five hair APIs belong to the v1.0 family. They share identical authentication (RSA access\_token), file upload patterns, and style-discovery endpoints. The source image for all hair tasks is the Headshot Canvas.

## **5.1 Common Hair API Pattern**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Auth Server | https://yce-api-01.perfectcorp.com |
| Auth Endpoint | POST /s2s/v1.0/client/auth |
| Access Token TTL | 2 hours - cache server-side, refresh proactively |
| request\_id | Incremental integer per task. Same request\_id = idempotent (prevents duplicate credit deduction on retry). |
| polling\_interval | Returned in GET response (typically 500ms). Must respect this value - polling faster does NOT speed up results. |
| Polling Timeout | Stop polling after 120 attempts (if interval=500ms, that's 60 seconds). |
| dst\_id | The output file\_id can be reused as the src\_id for the next Hair API call without re-uploading. |

## **5.2 Image Constraints (All Hair APIs)**

|  |  |
| --- | --- |
| **Constraint** | **Value** |
| Max Resolution | long side <= 1024px, < 10MB |
| Min Face Width | >= 128px |
| Pitch (up/down tilt) | -10° to +10° |
| Yaw (left/right turn) | -45° to +45° |
| Roll (head tilt) | -15° to +15° |
| Formats | JPG, PNG |
| error\_large\_face\_angle | Returned if pose exceeds constraints - advise user to retake photo. |

## **5.3 AI Hairstyle Generator**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v1.0/file/hair-style |
| Task Endpoint | POST /s2s/v1.0/task/hair-style |
| Style Groups | GET /s2s/v1.0/task/style-group/hair-style (paginated, page\_size 1-20) |
| Styles | GET /s2s/v1.0/task/style/hair-style?style\_group\_id=<id> (returns id, title, thumb URL) |
| src\_ids | Single Headshot Canvas file\_id |
| style\_group\_id + style\_ids | Required. Obtain via style discovery endpoints or hardcode from Perfect Console. |
| Use Case | Primary hair module. Replaces full hairstyle with completely new AI-generated style. |

// POST /s2s/v1.0/task/hair-style - Request Body
{
"request\_id": 0,
"payload": {
"file\_sets": { "src\_ids": ["<headshot\_file\_id>"] },
"actions": [{
"id": 0,
"params": {
"style\_group\_id": 18213963761051864,
"style\_ids": [22205685004925400] // e.g. "Long Wave"
}
}],
"output\_ext": "jpg"
}
}

## **5.4 AI Hair Color**

Hair color change is applied using a dedicated color style within the Hairstyle Generator's style catalog. Style groups prefixed with 'Color' contain color-only transformations that preserve the existing hair shape.

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Endpoint | Same as AI Hairstyle: /s2s/v1.0/task/hair-style |
| Difference | style\_group\_id should target a 'Hair Color' style group (fetched via style-group endpoint). The AI replaces hair color while preserving texture and shape. |
| Recipe Storage | Store style\_group\_id + style\_id. On community try-on, re-apply against the viewer's headshot. |

## **5.5 AI Hair Extension**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v1.0/file/hair-ext |
| Task Endpoint | POST /s2s/v1.0/task/hair-ext |
| Style Groups | GET /s2s/v1.0/task/style-group/hair-ext |
| Behavior | Adds hair length to existing natural hair. Blends with current hair texture and color. Suitable for 'add length without changing style'. |

## **5.6 AI Hair Bangs Generator**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v1.0/file/hair-bang |
| Task Endpoint | POST /s2s/v1.0/task/hair-bang |
| Style Groups | GET /s2s/v1.0/task/style-group/hair-bang |
| Behavior | Adds/changes fringe/bangs. Can be applied after a hairstyle change by using the hairstyle result's dst\_id as the input src\_id. |

## **5.7 AI Hair Volume Generator**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v1.0/file/hair-vol |
| Task Endpoint | POST /s2s/v1.0/task/hair-vol |
| Style Groups | GET /s2s/v1.0/task/style-group/hair-vol |
| Behavior | Enhances fullness and density of existing hair. Does not change style or color. Recommended as a post-processing step applied last in the hair pipeline. |

## **5.8 Hair Processing Pipeline Sequence**

When multiple hair effects are active, they must be chained in this recommended order using dst\_id threading:

1. **AI Hairstyle** - Full style replacement (if selected)
2. **AI Hair Color** - Color change applied on hairstyle result
3. **AI Hair Extension** - Length added on color result
4. **AI Hair Bangs** - Bangs overlaid on extension result
5. **AI Hair Volume** - Volume enhancement applied last

If a step is not selected by the user, skip it and pass the previous step's dst\_id forward. The final output is used in the Headshot composite rendering.

# **6. Module D: Nail Art API**

## **6.1 AI Nail VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Endpoint | POST /s2s/v2.0/file/nail-vto |
| Task Endpoint | POST /s2s/v2.0/task/nail-vto |
| Poll Endpoint | GET /s2s/v2.0/task/nail-vto/<task\_id> |
| Auth Family | v2.0 Bearer |
| Source Image | Hand & Wrist Canvas |
| Image Constraints | Hand clearly visible, fingers spread, < 10MB, JPG/PNG |

## **6.2 Nail Configuration Schema**

Nail configuration supports per-finger control or global application. Custom texture upload is the primary UI feature for cosplay nail art.

// Nail VTO request body
{
"src\_file\_url": "<hand\_wrist\_public\_url>",
"nail\_config": {
"apply\_to": "all", // "all" | "thumb" | "index" | "middle" | "ring" | "pinky"
"color": "#FF1493", // hex color (used when no texture is uploaded)
"texture": "glitter", // "matte" | "gloss" | "glitter" | "chrome" | "custom"
"colorIntensity": 90, // 0-100
"custom\_texture\_url": "<uploaded\_nail\_art\_image\_url>", // for "custom" texture
"shape": "stiletto" // "square" | "round" | "oval" | "stiletto" | "coffin"
}
}

## **6.3 Custom Nail Art Upload Flow**

When the user uploads a custom nail texture or decal image:

1. Upload the nail art file to the proxy: POST /api/perfectcorp/nail-vto/file
2. The proxy stores it in Vercel Blob Storage and returns a public URL
3. The public URL is passed as custom\_texture\_url in the nail-vto task request
4. Set texture: 'custom' to activate the uploaded texture
5. Store the Vercel Blob URL in the Recipe's nail\_config for community replay

## **6.4 Hand Map - Per-Nail Control**

The Hand Map UI allows the user to click individual finger regions. Clicking a single finger applies to that finger only. A 'Select All' toggle sets apply\_to: 'all'. For mixed configurations (e.g., accent nail different), make separate sequential API calls using the previous call's result as the next source.

# **7. Jewelry & Accessories APIs**

Rings, bracelets, watches, and necklaces all use the v2.0 Bearer authentication and follow the standard async task pattern. All are applied to the Hand & Wrist Canvas (rings, bracelets, watches) or Headshot Canvas (necklaces).

## **7.1 Ring VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/ring |
| Source Image | Hand & Wrist Canvas |
| Reference Image | Ring product photo (isolated on white or transparent background) |
| finger | Target finger: 'index' | 'middle' | 'ring' (default) | 'pinky' | 'thumb' |
| Stacking | To apply multiple rings: chain tasks using dst\_id as next src\_id. Apply to different fingers sequentially. |
| Image Constraints | < 10MB, JPG/PNG. Hand clearly visible with fingers separated. |

## **7.2 AI Bracelet VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/bracelet |
| Source Image | Hand & Wrist Canvas |
| Reference Image | Bracelet product photo |
| wrist | 'left' | 'right' - matches the wrist visible in the photo |
| Stacking | Chain multiple bracelet tasks via dst\_id threading for layered bracelet looks. |

## **7.3 AI Watch VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/watch |
| Source Image | Hand & Wrist Canvas |
| Reference Image | Watch product photo (official brand imagery recommended for strap detail) |
| wrist | 'left' | 'right' |
| Note | Cannot stack with bracelet on the same wrist in a single call - use chain task for watch + bracelet sets. |

## **7.4 AI Necklace VTO**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Task Endpoint | POST /s2s/v2.0/task/necklace |
| Source Image | Headshot Canvas (shows neck and décolletage) |
| Reference Image | Necklace product photo on white background |
| Image Constraints | Headshot must show neck fully. long side < 1920px, < 10MB, JPG/PNG |

# **8. The Recipe JSON Schema**

The 'Recipe' is the serializable representation of a complete CharacterForge design. It contains all parameters needed to reproduce the four composite renderings on any user's base photos. User photos are NEVER stored in the Recipe.

## **8.1 Top-Level Schema**

{
"recipe\_id": "uuid-v4",
"schema\_version": "1.0",
"created\_at": "ISO 8601 timestamp",
"author\_id": "user\_id",
"wardrobe": { /\* Module A \*/ },
"makeup": { /\* Module B \*/ },
"hair": { /\* Module C \*/ },
"nails": { /\* Module D \*/ },
"jewelry": { /\* Section 7 \*/ }
}

## **8.2 wardrobe Object**

"wardrobe": {
"items": [
{
"item\_id": "uuid",
"type": "upper\_body", // garment\_category for Clothes API
"prompt": "Cyberpunk leather jacket with neon blue accents",
"generated\_image\_url": "https://vercel-blob.com/...", // white-bg isolated item
"change\_shoes": false
}
],
"bag": {
"ref\_image\_url": "https://vercel-blob.com/...",
"gender": "female"
},
"shoes": {
"ref\_image\_url": "https://...",
"gender": "female"
},
"hat": {
"ref\_image\_url": "https://..."
}
}

## **8.3 makeup Object**

"makeup": {
"type": "custom", // "custom" | "preset"
"preset\_ref\_url": null, // for "preset" type - URL of reference photo for Look VTO
"effects": [
{ "category": "skin\_smooth", "skinSmoothStrength": 55, "skinSmoothColorIntensity": 45 },
{ "category": "foundation", "palettes": [{ "color": "#F0C8A0", "colorIntensity": 50, ... }] },
{ "category": "blush", "pattern": { "name": "2colors6" }, "palettes": [...] },
// ... all other active effects
]
}

## **8.4 hair Object**

"hair": {
"style": { "style\_group\_id": 18213963761051864, "style\_id": 22205685004925400, "title": "Long Wave" },
"color": { "style\_group\_id": <color\_group\_id>, "style\_id": <color\_style\_id>, "title": "Honey Blonde" },
"extension": { "style\_group\_id": <ext\_group\_id>, "style\_id": <ext\_style\_id>, "title": "Extra Long" },
"bangs": { "style\_group\_id": <bang\_group\_id>, "style\_id": <bang\_style\_id>, "title": "Curtain Bangs" },
"volume": { "style\_group\_id": <vol\_group\_id>, "style\_id": <vol\_style\_id>, "title": "High Volume" }
}
// null any key that is not configured by the designer

## **8.5 nails Object**

"nails": {
"global": {
"color": "#FF1493",
"texture": "custom",
"custom\_texture\_url": "https://vercel-blob.com/nail-art-dragon.png",
"shape": "stiletto",
"colorIntensity": 90
},
"overrides": {
"ring": { "color": "#FFD700", "texture": "chrome" } // accent nail
}
}

## **8.6 jewelry Object**

"jewelry": {
"rings": [
{ "ref\_image\_url": "https://...", "finger": "ring" },
{ "ref\_image\_url": "https://...", "finger": "index" }
],
"bracelets": [
{ "ref\_image\_url": "https://...", "wrist": "left" }
],
"watch": { "ref\_image\_url": "https://...", "wrist": "left" },
"necklace": { "ref\_image\_url": "https://..." }
}

# **9. Rendering Pipeline & Orchestration**

## **9.1 Four-Pane Output Generation Sequence**

The rendering pipeline processes four canvases in parallel where possible, with sequential chaining within each canvas.

### **Headshot Canvas Pipeline**

1. **Makeup VTO** - Apply full effects[] array to original Headshot
2. **AI Necklace** - Apply to makeup result via dst\_id chain
3. **Hair Style** - Applied to necklace result (or original if no jewelry)
4. **Hair Color** → Hair Extension → Hair Bangs → Hair Volume - Sequential chain
5. **AI Hat** - Applied last to the final hair result

**Note:** The cross-family threading between v2.0 (Necklace) and v1.0 (Hair) requires saving the v2.0 result to Vercel Blob and re-uploading as a v1.0 file, since the dst\_id namespaces are not shared between API families.

### **Full Body Canvas Pipeline**

1. **AI Clothes (item 1)** - Applied to original Full Body photo
2. **AI Clothes (item 2…N)** - Chained sequentially via dst\_id
3. **AI Bag** - Applied to final clothing result

### **Hand & Wrist Canvas Pipeline**

1. **AI Watch** - Applied to original Hand photo
2. **AI Bracelet(s)** - Chained on watch result
3. **Ring(s)** - Chained per finger on bracelet result
4. **AI Nail VTO** - Applied last (on top of all jewelry)

### **Feet Canvas Pipeline**

1. **AI Shoes** - Direct application to Feet photo. No chaining needed.

## **9.2 State Machine for Progress UI**

// Zustand store - chargeForge recipe state
type TaskStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
interface CanvasState {
headshot: { current\_image\_url: string; task\_history: TaskResult[]; status: TaskStatus }
fullbody: { current\_image\_url: string; task\_history: TaskResult[]; status: TaskStatus }
handwrist: { current\_image\_url: string; task\_history: TaskResult[]; status: TaskStatus }
feet: { current\_image\_url: string; task\_history: TaskResult[]; status: TaskStatus }
}
// When user navigates BACK to a previous module,
// current\_image\_url serves as the starting point for new transformations.
// This avoids redundant API calls.

## **9.3 Community Try-On Replay**

When User B clicks on User A's published Recipe:

1. Fetch Recipe JSON from the CharacterForge database
2. Upload User B's four base photos to the proxy (Vercel Blob)
3. Execute the full rendering pipeline substituting User B's photos as source images
4. All Recipe parameters (effects, style IDs, ref\_image\_urls) are applied unchanged
5. Result images are ephemeral - displayed in the browser, not stored

# **10. Input Validation & Error Handling**

## **10.1 Frontend Upload Validation**

|  |  |  |  |
| --- | --- | --- | --- |
| **Canvas** | **Max Resolution** | **Max File Size** | **Accepted Formats** |
| Headshot | 1920px (long side) | 10 MB | JPG, JPEG, PNG |
| Full Body | 2048px (long side) | 10 MB | JPG, JPEG, PNG |
| Hand & Wrist | 1500px (long side) | 10 MB | JPG, JPEG, PNG |
| Feet | 1500px (long side) | 10 MB | JPG, JPEG, PNG |
| Nail Art Texture | 1024×1024 recommended | 5 MB | JPG, PNG, GIF |
| Ring / Accessory Ref | 1024×1024 recommended | 5 MB | JPG, PNG |

## **10.2 Perfect Corp Engine Error Codes**

|  |  |
| --- | --- |
| **Error Code** | **Recommended Client Action** |
| error\_face\_position\_invalid | Show overlay: 'Please ensure your full face is visible' |
| error\_face\_position\_too\_small | Show overlay: 'Move closer to the camera' |
| error\_face\_position\_out\_of\_boundary | Show overlay: 'Adjust your position - face is too large or partially cut off' |
| error\_face\_angle\_invalid | Show overlay: 'Keep your head straight. Max 10° tilt for front-facing shots' |
| error\_large\_face\_angle | Show overlay: 'Face angle too extreme for Hair API. Please use a more straight-on photo' |
| error\_no\_face | Block module progress. Show: 'No face detected. Please upload a clear headshot.' |
| error\_no\_shoulder | Block Clothes module. Show: 'Shoulders not visible. Use a full-body standing photo.' |
| error\_multiple\_people | Show: 'Multiple people detected. Please upload a solo photo.' |
| exceed\_max\_filesize | Block upload. Show file size limit message before submission. |
| error\_nsfw\_content\_detected | Log server-side. Show generic: 'Image could not be processed. Please try a different photo.' |
| CreditInsufficiency (400) | Show admin alert: 'API credits exhausted. Contact support.' |
| InvalidApiKey (401) | Trigger server-side token refresh. Retry once. If still 401, show maintenance message. |
| 429 Too Many Requests | Implement exponential backoff: wait 1s, 2s, 4s, 8s before retry. Max 4 retries. |
| 500 TaskTimeout | Task exceeded retention period. Re-submit the task. Show: 'Processing took too long. Retrying...' |

# **11. Rate Limiting, Performance & Caching**

## **11.1 Rate Limit Architecture**

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| Per IP Limit | 100 requests / 5 minutes (blocks with 429) |
| Per Token Limit | 100 requests / minute (blocks with 429) |
| Backoff Strategy | Exponential: 1s → 2s → 4s → 8s. Max 4 retries, then surface error to user. |
| Queue Management | The proxy maintains a per-user request queue in Redis. Each canvas pipeline is serialized within itself but the four canvases run in parallel. |

## **11.2 Intermediate Image Caching**

The frontend Zustand store acts as the primary cache for intermediate canvas states. The proxy also caches file\_ids in Redis with a 23-hour TTL (one hour short of Perfect Corp's 24-hour file retention period).

|  |  |
| --- | --- |
| **Field / Parameter** | **Description / Value** |
| File Retention (Perfect Corp) | Uploaded source files: 1 day. Generated result files: 30 days. |
| Proxy Cache Key | SHA-256(user\_id + module + file\_hash) → file\_id mapping in Redis |
| Cache Hit Behavior | If the same base photo is submitted for a module it has been used in before and the file\_id is still valid, skip the upload step entirely. |
| Result URL TTL | Result download\_url from Perfect Corp expires in 2 hours. If the user revisits, the proxy must re-submit the task using the cached file\_ids and Recipe parameters. |

## **11.3 Parallel Execution Strategy**

The four canvas pipelines are independent and are dispatched in parallel using Promise.allSettled(). Within each pipeline, API calls are sequential (chained via dst\_id). This minimizes total wall-clock time for the full four-pane render.

const [headshot, fullbody, handwrist, feet] = await Promise.allSettled([
runHeadshotPipeline(recipe, userPhotos),
runFullBodyPipeline(recipe, userPhotos),
runHandWristPipeline(recipe, userPhotos),
runFeetPipeline(recipe, userPhotos),
]);
// Each pipeline streams partial results back via SSE,
// so the UI updates progressively as each API call completes.

# **12. Zustand State Management**

## **12.1 Store Structure**

// characterforge.store.ts
interface CharacterForgeStore {
// The recipe being built
recipe: Recipe;
// User's four base photos (never leave the client)
basePhotos: {
headshot: File | null;
fullbody: File | null;
handwrist: File | null;
feet: File | null;
};
// Proxy-uploaded file\_ids for base photos
fileIds: {
headshot: string | null;
fullbody: string | null;
handwrist: string | null;
feet: string | null;
};
// Rendered canvas states (cached intermediate images)
canvases: CanvasState;
// Active task IDs for in-progress operations
activeTasks: Map<string, { taskId: string; module: string }>;
// Actions
setBasePhoto: (canvas: CanvasKey, file: File) => void;
updateRecipe: (path: string, value: unknown) => void;
applyMakeupEffect: (effect: MakeupEffect) => void;
triggerRender: (modules: string[]) => Promise<void>;
publishRecipe: () => Promise<string>;
}

## **12.2 Optimistic UI Updates**

When a user adjusts a makeup slider or selects a new hair style, the UI immediately shows a loading skeleton overlay on the affected canvas. The previous rendered image remains visible beneath the skeleton until the new result arrives. This prevents jarring blank states.

## **12.3 Backward Navigation Cache**

When the user navigates backward from Module C (Hair) to Module B (Makeup) and makes a change, the system must re-render only the affected downstream modules. The Zustand store tracks which modules are 'dirty' and re-executes only their pipelines using the cached intermediate result from the last clean state as the new starting point.

# **13. Complete API Reference Summary**

Quick reference for all 16 Perfect Corp APIs integrated in CharacterForge.

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **API / Module** | **Endpoint (Task)** | **Source Image** | **Auth** | **Recipe Storage Key** |
| Makeup VTO | /s2s/v2.0/task/makeup-vto | Headshot | v2.0 | makeup.effects[] |
| AI Look VTO | /s2s/v1.0/task/mu-trans-rec | Headshot | v1.0 | makeup.preset\_ref\_url |
| AI Nail VTO | /s2s/v2.0/task/nail-vto | Hand/Wrist | v2.0 | nails.global |
| AI Hairstyle | /s2s/v1.0/task/hair-style | Headshot | v1.0 | hair.style |
| AI Hair Color | /s2s/v1.0/task/hair-style | Headshot | v1.0 | hair.color |
| AI Hair Ext. | /s2s/v1.0/task/hair-ext | Headshot | v1.0 | hair.extension |
| AI Hair Bangs | /s2s/v1.0/task/hair-bang | Headshot | v1.0 | hair.bangs |
| AI Hair Volume | /s2s/v1.0/task/hair-vol | Headshot | v1.0 | hair.volume |
| AI Clothes | /s2s/v2.0/task/cloth | Full Body | v2.0 | wardrobe.items[] |
| AI Hat | /s2s/v2.0/task/hat | Headshot | v2.0 | wardrobe.hat |
| AI Bag | /s2s/v2.0/task/bag | Full Body | v2.0 | wardrobe.bag |
| AI Shoes | /s2s/v2.0/task/shoes | Feet | v2.0 | wardrobe.shoes |
| Ring VTO | /s2s/v2.0/task/ring | Hand/Wrist | v2.0 | jewelry.rings[] |
| AI Bracelet | /s2s/v2.0/task/bracelet | Hand/Wrist | v2.0 | jewelry.bracelets[] |
| AI Watch | /s2s/v2.0/task/watch | Hand/Wrist | v2.0 | jewelry.watch |
| AI Necklace | /s2s/v2.0/task/necklace | Headshot | v2.0 | jewelry.necklace |