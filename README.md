# 42 Belgium Header for VSCode

This extension provides integration of the 42 (Belgium) header in VS Code.

```bash
# ************************************************************************** #
#                                                                            #
#                                                        :::      ::::::::   #
#   vscode-42header                                    :+:      :+:    :+:   #
#                                                    +:+ +:+         +:+     #
#   By: kube <hello@kube.io>                       +#+  +:+       +#+        #
#                                                +#+#+#+#+#+   +#+           #
#   Created: 2013/11/18 13:37:42 by kube              #+#    #+#             #
#   Updated: 2026/03/13 10:23:51 by nicopasla        ###   #######belgium.be #
#                                                                            #
# ************************************************************************** #
```

## Features
- Insert 42 header (Belgium variant) into supported files
- Automatic header update on save
- Auto-rename header filename when the file is renamed
- Optional auto-insert of the header when creating a new file
- Status bar integration showing the current header author
- Insert or update the header directly from the status bar

## Install

Install it from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=nicopasla.42belgiumheader)

OR

Launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install 42belgiumheader
```

## Usage

### Insert a header
 - **macOS** : <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>H</kbd>
 - **Linux** / **Windows** : <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>H</kbd>.

Header is automatically updated on save.

### Auto-insert
To automatically insert a header when a new empty supported file is created, enable it in *User Settings*:
```ts
{
  "42header.autoInsert": true
}
```

### Status bar
When a supported file is open, the current header author is shown in the status bar. Clicking it inserts or updates the header.

### Auto-rename
When a supported file is renamed, the filename field in the header is automatically updated.

## Configuration

Default values for **username** and **email** are imported from environment variables.

To override these values, specify these properties in *User Settings* :

```ts
{
  "42header.username": string,
  "42header.email": string
}
```

## Build from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
vsce package

# Install in VSCode
code --install-extension 42belgiumheader-1.0.2.vsix
```
## Issues

In case of a bug or missing feature, please open a [GitHub Issue](https://github.com/nicopasla/vscode-42header/issues) or submit a [Pull Request](https://github.com/nicopasla/vscode-42header/pulls).

## Credits

- Originally created by [kube](https://github.com/kube/vscode-42header) — adapted for use by 42 Belgium students by [nicopasla](https://github.com/nicopasla).

- The extension logo is based on the [42 Logo SVG](https://commons.wikimedia.org/wiki/File:42_Logo.svg) (public domain) and has been modified to include the `BE` identifier for this project.

## Disclaimer

This extension is a personal project and is **not officially affiliated** with 42 Belgium.

## License

MIT
