# CMRIT Vault – Mobile UI Design Constraints 

---

## **1️⃣ Colors**

| Role          | Hex       | Usage                                  |
| ------------- | --------- | -------------------------------------- |
| Main Blue     | `#45c9fa` | Primary buttons, highlights, banners   |
| Accent Yellow | `#fadf45` | Callouts, badges, secondary highlights |
| Accent Orange | `#fa6445` | Alerts, important notifications        |
| Black         | `#000000` | Primary text                           |
| White         | `#FFFFFF` | Backgrounds, cards                     |

---

## **2️⃣ Typography**

* Style: Playful, Educational, Legible
* Hierarchy:

  * Headlines: Bold, larger, rounded
  * Card labels / subtext: Regular, max 2 lines
  * Section titles: Bold, medium
* Maintain **consistent font sizes, spacing, and max lines** across all sections to avoid overflow.

---

## **3️⃣ Spacing & Layout**

* **Outer padding:** 16px (adaptive: can scale with screen width for small devices)
* **Section spacing:** 20–28px (adaptive if needed)
* **Card spacing:** 12–16px
* **Cards:** Rounded corners 12–20px
* **Scrollable vertical layout:** `SingleChildScrollView` / `CustomScrollView`
* **SafeArea:** Always wrap main Scaffold body to prevent overflow on top/bottom

---

## **4️⃣ Components & Sections**

---

### **Top Header**

* Horizontal row:

  * Left: `"CMRIT Vault"` (no subtext)
  * Right:

    * Logged in → dynamic **user avatar** (from backend)
    * Not logged in → `"Sign Up / Sign In"` button or small icon
* Alignment & spacing: consistent with BigBasket mobile top header
* **Do not use `appIcon.png` here** (reserved for branding / splash)

---

### **Search Bar**

* Full-width rounded container, height 48–52px (adaptive if needed)
* Inside:

  * Left: 🔍 search icon
  * Placeholder: `"Search notes, PYQs, subjects..."`
  * Right: optional 🎤 mic / filter icon
* Clickable → navigates to **Search screen**
* Sticky optional for future

---

### **Hero Banner**

* Large, full-width card, **adaptive height** (~25% of screen height recommended)
* Horizontal padding: 16px
* Content: Announcements, Featured subjects, Top resources
* **Image References**:

  * `Banner1.png` → Top Resource Highlight
  * `Banner2.png` → Featured Announcement
  * `Banner3.png` → Exam Reminder / Weekly Focus
* **Loading animation placeholder:** `Loading.webm` for Hero Banner or any loading states

---

### **Horizontal Quick Actions**

* Scrollable row of small rounded cards (icon + label)
* Labels: Notes, PYQs, Subjects, Downloads, Favorites, Trending
* Icons reused from **UI toolkit**
* Spacing: 12–16px
* Cards adaptive width, text ellipsis if overflow

---

### **Category Grid Sections**

* Section title: Bold, medium font
* Grid: 2–4 columns, **adaptive card width**
* Sections:

  * **Subjects:** OS, DBMS, CN, AI, ML
  * **Resource Types:** Notes, PDFs, Assignments, Lab Manuals
  * **Semester:** Sem 1 → Sem 8
* Placeholder cards initially, real API data later
* Use `Flexible` / `Expanded` for text inside cards to avoid overflow

---

### **Featured Carousel / Cards**

* Horizontal swipeable cards
* Titles: Top Rated Resources, Most Downloaded, Exam Must-Read
* Rounded card design, consistent spacing
* Image placeholders: reuse Hero Banner images or illustrations
* Adaptive height and width; text maxLines to prevent overflow

---

### **Resource Grid**

* Grid/list of resources (PDFs, Notes)
* Card structure:

  * Thumbnail (PDF preview or icon, BoxFit.contain)
  * Title (max 2 lines, overflow ellipsis)
  * Subject tag
  * Metadata: Downloads count, File type
  * CTA: View / Download
* Reuse card component across grid for consistency

---

### **Resource Detail Page**

* Top: Large preview (image / PDF), back button + actions (favorite/share)
* Middle: Title, Subject, Description (adaptive text height)
* Metadata section: File size, Uploaded by, Date, Downloads count
* Variants section:

  * Notes v1, Notes v2, PYQ set 1
* Bottom sticky CTA: `"Download PDF"`

---

### **Bottom Navigation**

* Fixed navigation bar at bottom
* Icons + labels:

  * 🏠 Home
  * 📂 Categories
  * 🔍 Search
  * 📥 Downloads
  * 👤 Profile
* Use **SafeArea** to prevent conflicts with small devices

---

## **5️⃣ Features for Populating UI**

1. Recently Viewed
2. Continue Studying
3. Favorites
4. Most Downloaded
5. Recently Uploaded
6. Subject-wise Sections
7. Static Banners
8. Subject Grouping
9. File Type Filters

*Suggested Implementation Order (per sprint):*

| Sprint | Features / Components                                        | Difficulty    |
| ------ | ------------------------------------------------------------ | ------------- |
| 1      | Top Header + Search Bar + Hero Banner                        | Easy          |
| 2      | Quick Actions + Bottom Nav                                   | Easy → Medium |
| 3      | Category Grids (Subjects / Resource Types / Semesters)       | Medium        |
| 4      | Featured Carousel                                            | Medium        |
| 5      | Resource Grid                                                | Medium → Hard |
| 6      | Resource Detail Page                                         | Hard          |
| 7      | Optional Enhancements (Recently Viewed / Continue / Filters) | Medium → Hard |

---

## **6️⃣ Asset References**

| File           | Usage                                                                |
| -------------- | -------------------------------------------------------------------- |
| `appIcon.png`  | App branding: splash screen / launcher / Hero Banner optional corner |
| `Banner1.png`  | Hero Banner / Top Resource Highlight                                 |
| `Banner2.png`  | Hero Banner / Featured Announcement                                  |
| `Banner3.png`  | Hero Banner / Exam Reminder / Weekly Focus                           |
| `Loading.webm` | Splash screen + loading placeholders anywhere needed                 |

---

## **7️⃣ Overflow Prevention & Responsive Guidelines**

1. Use **SafeArea** for all Scaffold bodies
2. Use **Flexible / Expanded** for text in cards
3. Horizontal lists (quick actions, carousels) → scrollable inside main vertical scroll
4. Adaptive heights for banners, grids, and cards (`MediaQuery` % of screen)
5. Text wrapping → `maxLines: 2` and `overflow: TextOverflow.ellipsis`
6. Avoid fixed pixel heights unless absolutely necessary
7. Dynamic padding scaling for very small/large devices

---

## **8️⃣ Codex / UI Generation Guidelines**

* Always respect **spacing, rounded corners, typography, and color rules**
* Reuse **cards/grid components** for all vertical/horizontal lists
* Use placeholders initially, replace with **API data** later
* **Check all endpoints and functionality**:

  * If any backend route / API / feature is missing → **report to user before generating UI**
  * Do **not bypass logic**; dynamic content must reflect backend contracts
* Stick to **BigBasket-inspired layout** for consistency and professional feel

---
