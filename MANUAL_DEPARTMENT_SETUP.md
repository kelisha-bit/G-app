# 📝 Manual Department Setup Guide

## Add Departments via Firebase Console (5 Minutes)

Since the seeder script requires special permissions, here's how to add departments manually:

---

## Step-by-Step Instructions

### 1. Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Select: **"greater-works-city-churc-4a673"**
3. Click: **"Firestore Database"** in left menu
4. Click: **"Data"** tab

### 2. Create Departments Collection
- If you don't have a "departments" collection yet:
  - Click **"Start collection"**
  - Collection ID: `departments`
  - Click **"Next"**

- If "departments" collection already exists:
  - Just click on it

---

## 🎵 Department 1: Worship & Music

**Document ID**: `worship`

Click "Add document" and add these fields:

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Worship & Music` |
| `icon` | string | `musical-notes` |
| `color` | string | `#ec4899` |
| `description` | string | `Leading the congregation in worship` |
| `fullDescription` | string | `The Worship & Music department is dedicated to leading the congregation into the presence of God through music, song, and worship.` |
| `memberCount` | number | `0` |
| `members` | array | (empty array - click "+ Add item" then remove it to make empty) |
| `meetings` | string | `Weekly` |
| `createdAt` | timestamp | (click "Insert" → "Timestamp" → "Now") |
| `updatedAt` | timestamp | (click "Insert" → "Timestamp" → "Now") |

**For leaders array** (click "Add field"):
- Field name: `leaders`
- Type: array
- Click "+ Add item" and select "map"
  - Add fields to this map:
    - `name` (string): `Michael Johnson`
    - `role` (string): `Worship Director`
    - `phone` (string): `+233 20 123 4567`

**For activities array**:
- Field name: `activities`
- Type: array
- Add these strings:
  - `Lead Sunday worship services`
  - `Organize choir practice and rehearsals`
  - `Coordinate with guest worship leaders`
  - `Maintain musical instruments and equipment`

**For schedule map**:
- Field name: `schedule`
- Type: map
- Add fields:
  - `frequency` (string): `Every Sunday and Wednesday`
  - `day` (string): `Wednesday`
  - `time` (string): `6:00 PM`
  - `location` (string): `Main Sanctuary`

**For requirements array**:
- Field name: `requirements`
- Type: array
- Add strings:
  - `Love for worship and music`
  - `Ability to sing or play an instrument`
  - `Commitment to weekly rehearsals`

**For contact map**:
- Field name: `contact`
- Type: map
- Add fields:
  - `name` (string): `Michael Johnson`
  - `phone` (string): `+233 20 123 4567`
  - `email` (string): `worship@greatworkscity.org`

Click **Save**

---

## 📹 Department 2: Media & Tech

**Document ID**: `media`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Media & Tech` |
| `icon` | string | `videocam` |
| `color` | string | `#6366f1` |
| `description` | string | `Audio, video, and technical support` |
| `fullDescription` | string | `The Media & Tech department ensures that all technical aspects of church services run smoothly.` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |
| `meetings` | string | `Weekly` |

**leaders**: (array of maps)
- Leader 1: `name`: David Chen, `role`: Media Director, `phone`: +233 20 345 6789

**activities**: (array)
- Operate sound and lighting systems
- Record and edit sermon videos
- Manage live streaming services
- Maintain technical equipment

**schedule**: (map)
- `frequency`: Every Sunday
- `day`: Saturday
- `time`: 4:00 PM
- `location`: Media Room

**requirements**: (array)
- Basic technical knowledge
- Willingness to learn new systems
- Reliability and punctuality

**contact**: (map)
- `name`: David Chen
- `phone`: +233 20 345 6789
- `email`: media@greatworkscity.org

---

## 👥 Department 3: Ushering

**Document ID**: `ushering`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Ushering` |
| `icon` | string | `people` |
| `color` | string | `#10b981` |
| `description` | string | `Welcoming and guiding members` |
| `fullDescription` | string | `The Ushering department serves as the first point of contact for church members and visitors.` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |
| `meetings` | string | `Bi-weekly` |

**leaders**: Grace Mensah, Head Usher, +233 20 456 7890

---

## 😊 Department 4: Children Ministry

**Document ID**: `children`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Children Ministry` |
| `icon` | string | `happy` |
| `color` | string | `#f59e0b` |
| `description` | string | `Teaching and caring for children` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |

**leaders**: Rebecca Osei, Children's Ministry Director

---

## 🙏 Department 5: Prayer Team

**Document ID**: `prayer`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Prayer Team` |
| `icon` | string | `hand-left` |
| `color` | string | `#8b5cf6` |
| `description` | string | `Intercession and prayer ministry` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |

**leaders**: Elder Samuel Owusu, Prayer Coordinator

---

## 🍽️ Department 6: Hospitality

**Document ID**: `hospitality`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Hospitality` |
| `icon` | string | `restaurant` |
| `color` | string | `#14b8a6` |
| `description` | string | `Food and refreshment services` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |

**leaders**: Mrs. Mary Appiah, Hospitality Coordinator

---

## 📢 Department 7: Evangelism

**Document ID**: `evangelism`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Evangelism` |
| `icon` | string | `megaphone` |
| `color` | string | `#ef4444` |
| `description` | string | `Outreach and soul winning` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |

**leaders**: Pastor Emmanuel Boateng, Evangelism Director

---

## 💼 Department 8: Administration

**Document ID**: `admin`

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Administration` |
| `icon` | string | `briefcase` |
| `color` | string | `#3b82f6` |
| `description` | string | `Church operations and management` |
| `memberCount` | number | `0` |
| `members` | array | (empty) |

**leaders**: James Asante, Admin Manager

---

## 🔧 Department 9: Workers

**Document ID**: `workers`

Click "Add document" and add these fields:

| Field | Type | Value |
|-------|------|-------|
| `name` | string | `Workers` |
| `icon` | string | `construct` |
| `color` | string | `#f97316` |
| `description` | string | `Maintenance and facility management` |
| `fullDescription` | string | `The Workers department is responsible for maintaining and caring for the church facilities. From repairs and maintenance to cleaning and setup, we ensure the church building is well-maintained and ready for all services and events.` |
| `memberCount` | number | `0` |
| `members` | array | (empty array) |
| `meetings` | string | `Monthly` |
| `createdAt` | timestamp | (click "Insert" → "Timestamp" → "Now") |
| `updatedAt` | timestamp | (click "Insert" → "Timestamp" → "Now") |

**For leaders array** (click "Add field"):
- Field name: `leaders`
- Type: array
- Click "+ Add item" and select "map"
  - Add fields to this map:
    - `name` (string): `Frank Kofi`
    - `role` (string): `Workers Coordinator`
    - `phone` (string): `+233 20 012 3456`

**For activities array**:
- Field name: `activities`
- Type: array
- Add these strings:
  - `Maintain church facilities and equipment`
  - `Handle repairs and renovations`
  - `Set up for services and events`
  - `Clean and sanitize facilities`
  - `Maintain landscaping and grounds`
  - `Manage supplies and inventory`

**For schedule** (map):
- Field name: `schedule`
- Type: map
- Add fields:
  - `frequency` (string): `Every first Saturday`
  - `day` (string): `First Saturday`
  - `time` (string): `8:00 AM`
  - `location` (string): `Church Grounds`

**For requirements array**:
- Field name: `requirements`
- Type: array
- Add these strings:
  - `Willingness to work with hands`
  - `Basic maintenance skills (helpful)`
  - `Teamwork and reliability`
  - `Physical capability for manual work`

**For contact** (map):
- Field name: `contact`
- Type: map
- Add fields:
  - `name` (string): `Frank Kofi`
  - `phone` (string): `+233 20 012 3456`
  - `email` (string): `workers@greatworkscity.org`

---

## ⚡ Quick Setup (Minimal Fields)

If you want to add departments quickly with just the essential fields:

### Minimal Required Fields Per Department:
1. `name` (string)
2. `icon` (string)
3. `color` (string)
4. `description` (string)
5. `memberCount` (number): `0`
6. `members` (array): empty

The app will handle missing optional fields gracefully.

---

## ✅ After Adding Departments

1. Refresh your app
2. Go to More → Departments
3. You should see all departments!
4. Try joining one to test

---

## 📋 Quick Reference: All 9 Departments

Copy this for reference:

| ID | Name | Icon | Color |
|----|------|------|-------|
| worship | Worship & Music | musical-notes | #ec4899 |
| media | Media & Tech | videocam | #6366f1 |
| ushering | Ushering | people | #10b981 |
| children | Children Ministry | happy | #f59e0b |
| prayer | Prayer Team | hand-left | #8b5cf6 |
| hospitality | Hospitality | restaurant | #14b8a6 |
| evangelism | Evangelism | megaphone | #ef4444 |
| admin | Administration | briefcase | #3b82f6 |
| workers | Workers | construct | #f97316 |

---

## 💡 Pro Tips

1. **Start with just 2-3 departments** to test
2. **Use copy-paste** for repeated fields
3. **Add more details later** as you go
4. **Test after each department** to ensure app works

---

That's it! Manual setup is tedious but guaranteed to work! 🎉

