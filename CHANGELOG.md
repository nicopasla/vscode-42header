# Changelog

## [Unreleased]

## [1.0.2] - 2026-03-20

### Added

- Auto-rename header filename on file rename
- Dependabot for automated dependency updates
- New test for the auto-rename function

### Changed

- Upgraded `types/node` from `20.x` to `25.x`
- Upgraded `types/vscode` from `1.80.0` to `1.110.0`
- Upgraded `typescript` from `5.3.0` to `5.9.3`
- Refactored extension.ts
  
### Removed

- Logo on the README
- .vscode files not used anymore

## [1.0.1] - 2026-03-19

### Fixed

- Added `extensionKind: ["ui", "workspace"]` for WSL compatibility

## [1.0.0] - 2026-03-19

### Added

- Status bar item showing the author
- Status bar button to insert or update the header
- Auto-insert on new file creation
- GitHub Actions workflow for automated build and testing
- Unit test support via Vitest
- Integration test support via `@vscode/test-cli` and `@vscode/test-electron`

### Changed

- Modernized codebase originally written in 2016
- Replaced 42 logo with the one from 42 Belgium
- Updated the generic template for 42 Belgium
- Replaced `moment.js` with native `Date` for timestamp generation
- Updated publisher to `nicopasla`

### Removed

- Dependency on `moment.js`

[unreleased]: https://github.com/nicopasla/vscode-42header/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/nicopasla/vscode-42header/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/nicopasla/vscode-42header/commits/v1.0.1
