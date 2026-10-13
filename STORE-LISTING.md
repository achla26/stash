# Save to Stash — Chrome Web Store kit

## Publish steps (tumhare side)
1. https://chrome.google.com/webstore/devconsole → **$5 one-time developer fee** (Google account se)
2. "New item" → zip upload karo (`stash-extension.zip`)
3. Store listing me neeche wala text paste karo, category: **Productivity**
4. Privacy practices tab: single purpose = "Save the current page to the user's own Stash account"
5. Review me bhejo → 2–7 din me live

## Store listing (copy-paste)
**Title:** Save to Stash — one-click link saver
**Summary (132 char limit):**
Save any page to your Stash learning hub in one click. Title and URL auto-fill, add a quick note, done in 2 seconds.

**Description:**
Save to Stash is the official companion extension for Stash — your personal learning hub for links, notes and vocabulary.

Reading something worth keeping? Click the Stash icon and the page's title and URL are already filled in. Add an optional quick note ("why am I saving this?") and hit Save — the link lands in your Stash account, ready to be organised into collections later.

Features
• One-click save: title + URL auto-filled from the active tab
• Optional quick note saved as the link description
• Works with any self-hosted or Vercel-deployed Stash instance
• Your credentials stay in local extension storage — never sent anywhere except your own Stash server

How to connect
Open the extension once, enter your Stash server URL (e.g. https://your-stash.vercel.app) plus your Stash login, and you're set. The extension stores a session token locally.

Note: this extension requires a Stash account (free at https://github.com/achla26/stash).

## Privacy policy (store ke privacy field + repo me bhi rakh sakti ho)
Save to Stash collects no personal data on any server of its own. The extension stores three values locally in Chrome storage: your Stash server URL, your session token, and nothing else. When you save a page, the extension sends the page title, URL and your optional note directly to YOUR Stash server over HTTPS, authenticated with your session token. The extension requests the "tabs"/"activeTab" permission only to read the active tab's title and URL for prefilling the save form, and broad HTTPS host permission only because your Stash server may be hosted on any domain you choose. No analytics, no tracking, no third-party sharing. Uninstalling removes all stored data.

## Single purpose statement (review form)
Lets the user save the active tab's title and URL, with an optional note, to their own self-hosted Stash instance via its HTTPS API.
