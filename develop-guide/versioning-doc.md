# Versioning Documentation in Docusaurus: A Comprehensive Guide

Docusaurus offers robust built-in support for versioning documentation, a critical feature for projects that evolve over time. Versioning allows you to maintain multiple versions of your documentation, ensuring users can access information relevant to the specific version of your software they are using. This comprehensive document will walk you through the process of setting up, managing, and optimizing versioned documentation in Docusaurus.

---

## 1. Understanding Versioning in Docusaurus

Docusaurus provides a straightforward system for versioning documentation:

- **Current Version**: This is the latest, actively maintained version of your documentation, stored in the `docs/` folder. It typically represents the "Next" version or the most recent unreleased changes.
- **Versioned Docs**: These are snapshots of your documentation at specific points in time, usually tied to software releases. They are stored in folders named `versioned_docs/version-<version>/`, such as `versioned_docs/version-1.0/` for version 1.0.

For example:

- `docs/` → Current version (e.g., "Next" or "2.0")
- `versioned_docs/version-1.0/` → Documentation for version 1.0
- `versioned_docs/version-1.1/` → Documentation for version 1.1

Each versioned set of documentation is a complete copy of the `docs/` folder at the time the version was created.

---

## 2. Setting Up Versioning

To begin versioning your documentation in Docusaurus, follow these steps:

### Step 1: Create Your First Version

When you're ready to release a new version of your software, create a versioned snapshot of your current documentation:

- Run the following command in your terminal:

  ```bash
  npm run docusaurus docs:version <version>
  ```

  or

  ```bash
  yarn docusaurus docs:version <version>
  ```

  Replace `<version>` with your desired version number, e.g., `1.0`.

- **What Happens**:
  - Docusaurus duplicates the entire `docs/` folder into `versioned_docs/version-1.0/`.
  - It updates the `versions.json` file, which tracks all versioned documentation.

### Step 2: Customize Version Labels

By default, the version number (e.g., "1.0") appears in the sidebar and version selector. You can customize these labels in `docusaurus.config.js`:

- Open `docusaurus.config.js` and locate the `themeConfig` section.
- Add or modify the `docs.sidebar.versionLabels` object.

Example:

```javascript
themeConfig: {
  docs: {
    sidebar: {
      versionLabels: {
        '1.0': 'Version 1.0 (Legacy)',
        '1.1': 'Version 1.1',
      },
    },
  },
},
```

---

## 3. Managing Versioned Documentation

Once versioning is set up, you can manage your documentation as follows:

### Updating Documentation

- **Current Version**: Edit files in the `docs/` folder to reflect the latest changes and features.
- **Versioned Docs**: To update a specific version (e.g., for corrections or clarifications), modify files in `versioned_docs/version-<version>/`.

**Note**: Limit changes to versioned docs to minor fixes. Major updates should go into the current version (`docs/`).

### Adding New Versions

When releasing a new software version:

1. Update the `docs/` folder with the latest content.
2. Run:
   ```bash
   npm run docusaurus docs:version <new-version>
   ```
   Example: `npm run docusaurus docs:version 2.0`.
3. This creates a new snapshot in `versioned_docs/version-2.0/`.

### Removing Versions

To delete a version:

1. Remove the corresponding folder (e.g., `versioned_docs/version-1.0/`).
2. Update `versions.json` by removing the version entry.

---

## 4. Configuring the Sidebar for Versioned Docs

Docusaurus handles sidebars for each version automatically, but you can customize them if needed.

### Automatic Sidebar Generation

- Docusaurus generates a sidebar for each version based on the folder structure in `versioned_docs/version-<version>/`.

### Manual Sidebar Configuration

For more control:

1. Create a `sidebars.js` file in the versioned docs folder (e.g., `versioned_docs/version-1.0/sidebars.js`).
2. Define the sidebar structure.

Example:

```javascript
module.exports = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      items: ["intro", "installation"],
    },
  ],
};
```

---

## 5. Linking to Versioned Docs

- **Version Selector**: Docusaurus includes a dropdown in the navigation bar, allowing users to switch between versions (e.g., "1.0", "2.0", "Next").
- **Direct Links**: Link to specific versions using URLs like `/docs/<version>/<doc-id>`. For example, `/docs/1.0/intro` links to the "intro" document in version 1.0.

---

## 6. Best Practices for Versioning

- **Version Naming**: Use semantic versioning (e.g., 1.0, 1.1, 2.0) for clarity.
- **Keep Current Version Updated**: Reflect the latest features and changes in `docs/`. Use versioned docs for historical reference.
- **Descriptive Labels**: Assign meaningful labels (e.g., "Version 1.0 (Legacy)") to help users identify versions.

---

## 7. Example Scenario

Let’s walk through versioning for a software project with two releases: 1.0 and 2.0.

- **Initial Setup**:

  - Your current documentation is in `docs/`.
  - Run `npm run docusaurus docs:version 1.0` to freeze version 1.0.
  - Result: `versioned_docs/version-1.0/` contains a snapshot of `docs/`.

- **Updating for Version 2.0**:

  - Update `docs/` with changes for version 2.0.
  - Run `npm run docusaurus docs:version 2.0`.
  - Result: `versioned_docs/version-2.0/` is created, and `docs/` becomes the "Next" version.

- **User Experience**:
  - Users can select "1.0", "2.0", or "Next" from the version dropdown to view the corresponding documentation.

---

## 8. Additional Resources

For more in-depth information, refer to the official Docusaurus documentation:

- [https://docusaurus.io/docs/versioning](https://docusaurus.io/docs/versioning)

---

This guide provides everything you need to create and manage versioned documentation in Docusaurus. By following these steps, you can ensure your users have access to the right documentation for their software version. Happy documenting!
