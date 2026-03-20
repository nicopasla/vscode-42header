# 42 Belgium Header for VSCode

This extension provides the 42 header integration in VS Code.

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
- Insert 42 header into compatible files
- Automatic header update on save
- Auto-rename header filename on file rename
- Auto-insert on new file creation (optional)
- Status bar showing current header author

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
Originally created by [kube](https://github.com/kube/vscode-42header) — modernized for 42 Belgium by [nicopasla](https://github.com/nicopasla).

## License

MIT
