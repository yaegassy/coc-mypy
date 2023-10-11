# coc-mypy

[microsoft/vscode-mypy](https://github.com/microsoft/vscode-mypy)'s langauge server extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

## Install

**CocInstall**:

```
:CocInstall @yaegassy/coc-mypy
```

**When using a plugin manager, etc**:

> e.g. vim-plug

```vim
Plug 'yaegassy/coc-mypy', {'do': 'yarn install --frozen-lockfile'}
```

## Server Install

[coc-mypy](https://github.com/yaegassy/coc-mypy) allows you to create an extension-only "venv" and install `microsoft/vscode-mypy's langauge server`.

When using [coc-mypy](https://github.com/yaegassy/coc-mypy) for the first time, if `microsoft/vscode-mypy's langauge server` is not present in the runtime environment, you will be prompted to do a built-in install.

To use the built-in installation feature, execute the following command.

```vim
:CocCommand mypy-type-checker.installServer
```

## Note

### [Use mypy] Initial Diagnostic Display

The `mypy` command takes time to complete execution if the cache file for `mypy` does not exist. In other words, the first time it is executed, it takes time.

The same is true if you are using a language server, so it will take some time to display the initial diagnostics.

## Configuration options

- `mypy-type-checker.enable`: Enable coc-mypy extension, default: `true`
- `mypy-type-checker.builtin.pythonPath`: Python 3.x path (Absolute path) to be used for built-in install, default: `""`
- `mypy-type-checker.showDocumantaion.enable`: Whether to display the code action for open the Mypy rule documentation web page included in the diagnostic information, default: `true`
- `mypy-type-checker.trace.server`: Traces the communication between coc.nvim and the language server, default: `"off"`

Other settings have the same configuration as [microsoft/vscode-mypy](https://github.com/microsoft/vscode-mypy).

## Commands

- `mypy-type-checker.restart`: Restart Server
- `mypy-type-checker.installServer`: Install Server
- `mypy-type-checker.showOutput`: Show output channel
- `mypy-type-checker.version`: Show the version of the server installed by the extension

## Thanks

- [microsoft/vscode-mypy](https://github.com/microsoft/vscode-mypy)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
