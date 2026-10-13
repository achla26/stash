# Save to Stash — Chrome extension (V1)

1-click save of the current page into your Stash account.

## Load locally (test before store)
1. Chrome → `chrome://extensions` → Developer mode ON
2. "Load unpacked" → ye folder select karo
3. Icon click karo → pehli baar server URL + Stash login daalo
4. Kisi bhi page pe icon click → title/URL auto-filled → "Save to Stash"

## Files
- `manifest.json` — MV3, permissions: storage/tabs/activeTab + https host (self-hosted servers)
- `popup.html` / `popup.js` — setup (login) + save form
- `icons/` — 16/48/128 PNG
- `STORE-LISTING.md` — store text + privacy policy + publish steps

## V2 ideas (baad me)
- Words quick-add, note scratch capture, keyboard shortcut (Alt+S), offline queue
