# Skills Index

This folder stores project skills in the filesystem-based Agent Skills shape: each skill is a directory containing a required `SKILL.md` file with YAML frontmatter. The frontmatter intentionally contains only `name` and `description`, matching the Claude Agent Skills structure.

## Skills

- [Theme Tokens and Theming](theme-tokens/SKILL.md)
- [Navigation and Routing](navigation-routing/SKILL.md)
- [Contexts and Holders](contexts-and-holders/SKILL.md)
- [Custom Hooks Catalog](custom-hooks/SKILL.md)
- [HTTP Services and Adapters](http-services/SKILL.md)
- [Services and Auth Integrations](services-and-auth/SKILL.md)
- [Forms and Inputs](forms-and-inputs/SKILL.md)
- [Components and Shared UI](components-and-shared-ui/SKILL.md)
- [Modals, Dialogs, and Toasts](modals-dialogs-toast/SKILL.md)
- [Testing and Jest Setup](testing-and-jest/SKILL.md)
- [Utilities and Helpers](utils-and-helpers/SKILL.md)
- [Feature Folder Structure](feature-structure/SKILL.md)
- [ESLint, Prettier and Formatting](eslint-prettier-formatting/SKILL.md)
- [Scrute Store](scrute-store/SKILL.md)
- [Running the Project](running-react-native/SKILL.md)
- [Scripts and Tooling](scripts-and-tooling/SKILL.md)
- [Modal Dialog Toast System](modal-dialog-toast-system/SKILL.md)
- [Assets, Icons, Images, Lotties, and SVG](assets-icons-images-lotties-svg/SKILL.md)
- [Log Economy Protocol](creating-logs/SKILL.md)
- [Android Build AAB and APK](android-build-aab-apk/SKILL.md)
- [Tech Lead's Club - Spec-Driven Development](tlc-spec-driven/SKILL.md)
- [Liquid Glass Design System](liquid-glass-design-system/SKILL.md)

## Authoring Rules

- Keep each skill in its own directory.
- Keep `SKILL.md` frontmatter limited to `name` and `description`.
- Use lowercase letters, digits, and hyphens for skill names.
- Put trigger guidance in `description`, because discovery only sees metadata before loading the body.
- Keep the body concise and move large optional details into one-level reference files when needed.
