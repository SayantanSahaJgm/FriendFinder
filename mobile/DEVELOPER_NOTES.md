Developer notes — TypeScript & dependencies

This file explains how to resolve native types and run TypeScript checks for the `mobile/` React Native app.

1) Install mobile dependencies

Open a terminal and run:

```powershell
cd mobile
npm install
```

This will install `react-native`, `react-native-ble-plx`, `react-native-permissions`, and other JS deps required by the mobile app. TypeScript will then be able to resolve package types such as `BleError`.

2) Use the local `mobile/tsconfig.json`

A minimal `mobile/tsconfig.json` has been added to help the editor and tooling when working inside `mobile/`.

If you still see warnings like "Cannot find module 'react-native-ble-plx' or its corresponding type declarations":

- Ensure you've run `npm install` in `mobile/`.
- Make sure your editor/IDE is using the `mobile` workspace or recognizes the local `tsconfig.json` for files under `mobile/`.
- Optionally remove the `types` field from `mobile/tsconfig.json` and allow packages to provide their own typings.

3) Installing typings (optional)

Some packages don't ship types. If a package lacks types, look for an `@types/` package (e.g. `@types/some-package`) or install the package's types manually.

4) Running TypeScript and lint locally

From the repo root or the `mobile` folder, run your usual lint/build commands. Examples:

```powershell
cd mobile
npm run lint
npm run build
```

Note: The repository CI may not run `npm install` for the `mobile/` folder by default; run the above locally to ensure types resolve.

If you'd like, I can also modify the monorepo configuration or add an editor workspace file to make `mobile/` open as a separate project with correct TypeScript settings.