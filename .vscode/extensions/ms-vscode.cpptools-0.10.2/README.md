# C/C++ for Visual Studio Code
This preview release of the extension adds language support for C/C++ to Visual Studio Code including:
* Language service 
  * Code Formatting (clang-format)
  * Auto-Completion (experimental)
  * Symbol Searching
  * Go to Definition
  * Peek Definition
* Debugging  
  * Support for debugging Windows (PDB, Mingw/Cygwin), Linux and OS X applications 
  * Line by line code stepping
  * Breakpoints (including conditional and function breakpoints)
  * Variable inspection
  * Multi-threaded debugging support
  * Core dump debugging support
  * Executing GDB or MI commands directly when using 'C++ (GDB/LLDB)' debugging environment
  * For help configuring the debugger see [Configuring launch.json for C/C++ debugging](https://github.com/Microsoft/vscode-cpptools/blob/master/launch.md) 
    on our [GitHub page](https://github.com/Microsoft/vscode-cpptools).

You can find more detailed information about C/C++ support on Visual Studio Code at our [documentation page](https://code.visualstudio.com/docs/languages/cpp).

If you run into any problems, please file an issue on [GitHub](https://github.com/Microsoft/vscode-cpptools/issues).

## Change History
### Version 0.10.2: March 1, 2017
* New `addWorkspaceRootToIncludePath` setting allows users to disable automatic parsing of all files under the workspace root. [#374](https://github.com/Microsoft/vscode-cpptools/issues/374)
* The cpp.hint file was missing from the vsix package. [#508](https://github.com/Microsoft/vscode-cpptools/issues/508)
* Switch header/source now respects `files.exclude`. [#485](https://github.com/Microsoft/vscode-cpptools/issues/485)
* Switch header/source performance improvements. [#231](https://github.com/Microsoft/vscode-cpptools/issues/231)
* Switch header/source now appears in the right-click menu.
* Improvements to signature help.
* Various other bug fixes.

### Version 0.10.1: February 9, 2017
* Bug fixes.

### Version 0.10.0: January 24, 2017
* Suppressed C++ language auto-completion inside a C++ comment or string literal. TextMate based completion is still available. 
* Fixed bugs regarding the filtering of files and symbols, including: 
  * Find-symbol now excludes symbols found in `files.exclude` or `search.exclude` files
  * Go-to-definition now excludes symbols found in `files.exclude` files (i.e. `search.exclude` paths are still included).
* Added option to disable `clang-format`-based formatting provided by this extension via `"C_Cpp.formatting" : "disabled"`
* Added new `pipeTransport` functionality within the `launch.json` to support pipe communications with `gdb/lldb` such as using `plink.exe` or `ssh`.
* Added support for `{command.pickRemoteProcess}` to allow picking of processes for remote pipe connections during `attach` scenarios. This is similar to how `{command.pickProcess}` works for local attach.
* Bug fixes.

### Version 0.9.3: December 8, 2016
* [December update](https://aka.ms/cppvscodedec) for C/C++ extension
* Ability to map source files during debugging using `sourceFileMap` property in `launch.json`.
* Enable pretty-printing by default for gdb users in `launch.json`.
* Bug fixes.

### Version 0.9.2: September 22, 2016
* Bug fixes.

### Version 0.9.1: September 7, 2016
* Bug fixes.

### Version 0.9.0: August 29, 2016
* [August update](https://blogs.msdn.microsoft.com/vcblog/2016/08/29/august-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Debugging for Visual C++ applications on Windows (Program Database files) is now available.
* `clang-format` is now automatically installed as a part of the extension and formats code as you type.
* `clang-format` options have been moved from c_cpp_properties.json file to settings.json (File->Preferences->User settings).
* `clang-format` fall-back style is now set to 'Visual Studio'.
* Attach now requires a request type of `attach` instead of `launch`.
* Support for additional console logging using the keyword `logging` inside `launch.json`.
* Bug fixes.

### Version 0.8.1: July 27, 2016
* Bug fixes.

### Version 0.8.0: July 21, 2016
* [July update](https://blogs.msdn.microsoft.com/vcblog/2016/07/26/july-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Support for debugging on OS X with LLDB 3.8.0. LLDB is now the default debugging option on OS X.
* Attach to process displays a list of available processes.
* Set variable values through Visual Studio Code's locals window. 
* Bug fixes.

### Version 0.7.1: June 27, 2016
* Bug fixes.

### Version 0.7.0: June 20, 2016
* [June Update](https://blogs.msdn.microsoft.com/vcblog/2016/06/01/may-update-for-the-cc-extension-in-visual-studio-code/) for C/C++ extension.
* Bug fixes.
* Switch between header and source.
* Control which files are processed under include path.

### Version 0.6.1: June 03, 2016
* Bug fixes.
 
### Version 0.6.0: May 24, 2016
* [May update](https://blogs.msdn.microsoft.com/vcblog/2016/07/26/july-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Support for debugging on OS X with GDB.
* Support for debugging with GDB on MinGW.
* Support for debugging with GDB on Cygwin.
* Debugging on 32-bit Linux now enabled.
* Format code using clang-format.
* Experimental fuzzy autocompletion.
* Bug fixes.

### Version 0.5.0: April 14, 2016
* Usability and correctness bug fixes. 
* Simplify installation experience.
* Usability and correctness bug fixes. 

## Contact Us
If you’d like to help us build the best C/C++ experience on any platform, [you can sign up to talk directly to the product team and influence our investment in this area](http://landinghub.visualstudio.com/c-nonwin).

If you run into any issues, please file an issue on [GitHub](https://github.com/Microsoft/vscode-cpptools/issues).
