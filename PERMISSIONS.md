# Permissions Usage and Privacy Policy

## Required Permissions

### Host Permissions (`*://*.twitter.com/*`, `*://*.x.com/*`, `*://*.eksisozluk.com/*`)
These permissions are required to:
- Read page content to identify troll accounts and harmful content
- Apply blocking rules to user-identified troll accounts
- Modify page content to hide blocked content
- Update UI elements to show blocking status
We do not collect, store, or transmit any user data from these domains.

### declarativeNetRequest
This permission is used to:
- Implement content filtering rules for identified troll accounts
- Block harmful content based on user-defined criteria
- Apply blocking rules efficiently without impacting performance
All blocking rules are processed locally and no data is sent to external servers.

### Other Permissions
- `activeTab`: Required to interact with the current tab for blocking operations
- `storage`: Required to store user preferences and block lists locally
- `tabs`: Required to update tab content when blocking actions are performed

## Privacy Policy and Data Usage

### Data Collection
- This extension does not collect any personal data
- All blocking rules and preferences are stored locally on your device
- No data is transmitted to external servers
- No analytics or tracking is implemented

### Data Storage
- Blocked account lists are stored locally using browser.storage API
- User preferences are stored locally
- No cloud sync or external storage is used

### Third-Party Services
- This extension does not interact with any third-party services
- No data is shared with external parties

## Developer Contact
For questions or concerns about privacy and data usage:
Email: sencerhan76@gmail.com

This extension complies with:
- Chrome Web Store Developer Program Policies
- Mozilla Add-ons Policies
- GDPR and CCPA requirements
