"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const settings_1 = require("../settings");
const utils_1 = require("../utils");
const packageJson = require("../../../package.json");
class IconGenerator {
    constructor(vscode, defaultSchema, avoidCustomDetection = false) {
        this.defaultSchema = defaultSchema;
        this.avoidCustomDetection = avoidCustomDetection;
        this.settings = new settings_1.SettingsManager(vscode).getSettings();
        // relative to this file
        this.iconsFolderPath = path.join(__dirname, '../../../', 'icons');
        this.manifestFolderPath = path.join(__dirname, '../../../', 'out/src');
    }
    generateJson(files, folders) {
        const iconsFolderBasePath = this.getRelativePath(this.manifestFolderPath, this.iconsFolderPath);
        return this.fillDefaultSchema(files, folders, iconsFolderBasePath, this.defaultSchema);
    }
    persist(iconsFilename, json, updatePackageJson) {
        if (iconsFilename == null) {
            throw new Error('iconsFilename not defined.');
        }
        this.writeJsonToFile(json, iconsFilename, this.manifestFolderPath);
        if (updatePackageJson) {
            const pathForPackageJson = `${this.getRelativePath('.', this.manifestFolderPath)}${iconsFilename}`;
            this.updatePackageJson(pathForPackageJson);
        }
    }
    buildFolders(folders, iconsFolderBasePath, hasDefaultLightFolder) {
        if (!iconsFolderBasePath) {
            iconsFolderBasePath = '';
        }
        const sts = this.settings.extensionSettings;
        return _.sortBy(folders.supported.filter(x => !x.disabled && x.icon), item => item.icon)
            .reduce((old, current) => {
            const defs = old.defs;
            const names = old.names;
            const light = old.light;
            const icon = current.icon;
            const hasLightVersion = current.light;
            const iconFolderType = `${sts.folderPrefix}${icon}`;
            const iconFolderLightType = `${sts.folderLightPrefix}${icon}`;
            const iconFileExtension = utils_1.fileFormatToString(current.format);
            const foldername = `${hasLightVersion
                ? iconFolderLightType
                : iconFolderType}${sts.iconSuffix}${iconFileExtension}`;
            const openfoldername = `${hasLightVersion
                ? iconFolderLightType
                : iconFolderType}_opened${sts.iconSuffix}${iconFileExtension}`;
            const folderIconPath = this.getIconPath(iconsFolderBasePath, foldername);
            const openFolderIconPath = this.getIconPath(iconsFolderBasePath, openfoldername);
            const folderPath = utils_1.pathUnixJoin(folderIconPath, iconFolderType);
            const folderLightPath = utils_1.pathUnixJoin(folderIconPath, iconFolderLightType);
            const openFolderPath = `${folderPath}_opened`;
            const openFolderLightPath = `${folderLightPath}_opened`;
            const iconFolderDefinition = `${sts.manifestFolderPrefix}${icon}`;
            const iconFolderLightDefinition = `${sts.manifestFolderLightPrefix}${icon}`;
            const iconOpenFolderDefinition = `${iconFolderDefinition}_open`;
            const iconOpenFolderLightDefinition = `${iconFolderLightDefinition}_open`;
            if (folderIconPath !== openFolderIconPath) {
                throw new Error(`Folder icons for '${icon}' must be placed in the same directory`);
            }
            defs[iconFolderDefinition] = {
                iconPath: `${folderPath}${sts.iconSuffix}${iconFileExtension}`,
            };
            defs[iconOpenFolderDefinition] = {
                iconPath: `${openFolderPath}${sts.iconSuffix}${iconFileExtension}`,
            };
            if (hasDefaultLightFolder && !hasLightVersion) {
                defs[iconFolderLightDefinition] = {
                    iconPath: `${folderPath}${sts.iconSuffix}${iconFileExtension}`,
                };
                defs[iconOpenFolderLightDefinition] = {
                    iconPath: `${openFolderPath}${sts.iconSuffix}${iconFileExtension}`,
                };
            }
            if (hasLightVersion) {
                defs[iconFolderLightDefinition] = {
                    iconPath: `${folderLightPath}${sts.iconSuffix}${iconFileExtension}`,
                };
                defs[iconOpenFolderLightDefinition] = {
                    iconPath: `${openFolderLightPath}${sts.iconSuffix}${iconFileExtension}`,
                };
            }
            current.extensions.forEach(extension => {
                const key = extension;
                names.folderNames[key] = iconFolderDefinition;
                names.folderNamesExpanded[key] = iconOpenFolderDefinition;
                light.folderNames[key] = hasLightVersion ? iconFolderLightDefinition : iconFolderDefinition;
                light.folderNamesExpanded[key] = hasLightVersion ? iconOpenFolderLightDefinition : iconOpenFolderDefinition;
            });
            return old;
        }, {
            defs: {},
            names: { folderNames: {}, folderNamesExpanded: {} },
            light: { folderNames: {}, folderNamesExpanded: {} },
        });
    }
    buildFiles(files, iconsFolderBasePath, hasDefaultLightFile) {
        if (!iconsFolderBasePath) {
            iconsFolderBasePath = '';
        }
        const sts = this.settings.extensionSettings;
        return _.sortedUniq(_.sortBy(files.supported.filter(x => !x.disabled && x.icon), item => item.icon))
            .reduce((old, current) => {
            const defs = old.defs;
            const names = old.names;
            const languageIds = old.languageIds;
            const light = old.light;
            const icon = current.icon;
            const hasLightVersion = current.light;
            const iconFileType = `${sts.filePrefix}${icon}`;
            const iconFileLightType = `${sts.fileLightPrefix}${icon}`;
            const iconFileExtension = utils_1.fileFormatToString(current.format);
            const filename = `${hasLightVersion
                ? iconFileLightType
                : iconFileType}${sts.iconSuffix}${iconFileExtension}`;
            const fileIconPath = this.getIconPath(iconsFolderBasePath, filename);
            const filePath = utils_1.pathUnixJoin(fileIconPath, iconFileType);
            const fileLightPath = utils_1.pathUnixJoin(fileIconPath, iconFileLightType);
            const iconFileDefinition = `${sts.manifestFilePrefix}${icon}`;
            const iconFileLightDefinition = `${sts.manifestFileLightPrefix}${icon}`;
            const isFilename = current.filename;
            defs[iconFileDefinition] = {
                iconPath: `${filePath}${sts.iconSuffix}${iconFileExtension}`,
            };
            if (hasDefaultLightFile && !hasLightVersion) {
                defs[iconFileLightDefinition] = {
                    iconPath: `${filePath}${sts.iconSuffix}${iconFileExtension}`,
                };
            }
            if (hasLightVersion) {
                defs[iconFileLightDefinition] = {
                    iconPath: `${fileLightPath}${sts.iconSuffix}${iconFileExtension}`,
                };
            }
            if (current.languages) {
                const assignLanguages = langId => {
                    languageIds[langId] = iconFileDefinition;
                };
                const assignLanguagesLight = langId => {
                    light.languageIds[langId] = hasLightVersion ? iconFileLightDefinition : iconFileDefinition;
                };
                current.languages.forEach(langIds => {
                    if (Array.isArray(langIds.ids)) {
                        langIds.ids.forEach(id => {
                            assignLanguages(id);
                            assignLanguagesLight(id);
                        });
                    }
                    else {
                        assignLanguages(langIds.ids);
                        assignLanguagesLight(langIds.ids);
                    }
                });
            }
            current.extensions.forEach(extension => {
                if (isFilename) {
                    names.fileNames[extension] = iconFileDefinition;
                    light.fileNames[extension] = hasLightVersion ? iconFileLightDefinition : iconFileDefinition;
                }
                else {
                    const noDotExtension = this.removeFirstDot(extension);
                    names.fileExtensions[noDotExtension] = iconFileDefinition;
                    light.fileExtensions[noDotExtension] = hasLightVersion ? iconFileLightDefinition : iconFileDefinition;
                }
            });
            return old;
        }, {
            defs: {},
            names: { fileExtensions: {}, fileNames: {} },
            light: { fileExtensions: {}, fileNames: {}, languageIds: {} },
            languageIds: {},
        });
    }
    getRelativePath(fromDirPath, toDirName, checkDirectory = true) {
        if (fromDirPath == null) {
            throw new Error('fromDirPath not defined.');
        }
        if (toDirName == null) {
            throw new Error('toDirName not defined.');
        }
        if (checkDirectory && !fs.existsSync(toDirName)) {
            throw new Error(`Directory '${toDirName}' not found.`);
        }
        const relativePath = path.relative(fromDirPath, toDirName).replace(/\\/g, '/');
        return `${relativePath}${(relativePath.endsWith('/') ? '' : '/')}`;
    }
    removeFirstDot(txt) {
        return txt.indexOf('.') === 0 ? txt.substring(1, txt.length) : txt;
    }
    buildDefaultIconPath(defaultExtension, schemaExtension, iconsFolderBasePath, isOpenFolder) {
        if (!defaultExtension || defaultExtension.disabled) {
            return schemaExtension.iconPath || '';
        }
        const defPrefix = this.settings.extensionSettings.defaultExtensionPrefix;
        const openSuffix = isOpenFolder ? '_opened' : '';
        const iconSuffix = this.settings.extensionSettings.iconSuffix;
        const icon = defaultExtension.icon;
        const format = defaultExtension.format;
        const filename = `${defPrefix}${icon}${openSuffix}${iconSuffix}${utils_1.fileFormatToString(format)}`;
        const fPath = this.getIconPath(iconsFolderBasePath, filename);
        return utils_1.pathUnixJoin(fPath, filename);
    }
    fillDefaultSchema(files, folders, iconsFolderBasePath, defaultSchema) {
        const schema = _.cloneDeep(defaultSchema);
        const defs = schema.iconDefinitions;
        // set default icons for dark theme
        defs._file.iconPath =
            this.buildDefaultIconPath(files.default.file, defs._file, iconsFolderBasePath, false);
        defs._folder.iconPath =
            this.buildDefaultIconPath(folders.default.folder, defs._folder, iconsFolderBasePath, false);
        defs._folder_open.iconPath =
            this.buildDefaultIconPath(folders.default.folder, defs._folder_open, iconsFolderBasePath, true);
        // set default icons for light theme
        // default file and folder related icon paths if not set,
        // inherit their icons from dark theme.
        // The icon paths should not be set unless there is a specific icon for them.
        // If the icon paths get set then they override the dark theme section
        // and light icons definitions have to be specified for each extension
        // and populate the light section, otherwise they inherit from dark theme
        // and only those in 'light' section get overriden.
        defs._file_light.iconPath =
            this.buildDefaultIconPath(files.default.file_light, defs._file_light, iconsFolderBasePath, false);
        defs._folder_light.iconPath =
            this.buildDefaultIconPath(folders.default.folder_light, defs._folder_light, iconsFolderBasePath, false);
        defs._folder_light_open.iconPath =
            this.buildDefaultIconPath(folders.default.folder_light, defs._folder_light_open, iconsFolderBasePath, true);
        // set the rest of the schema
        return this.buildJsonStructure(files, folders, iconsFolderBasePath, schema);
    }
    buildJsonStructure(files, folders, iconsFolderBasePath, schema) {
        // check for light files & folders
        const hasDefaultLightFolder = schema.iconDefinitions._folder_light.iconPath != null &&
            schema.iconDefinitions._folder_light.iconPath !== '';
        const hasDefaultLightFile = schema.iconDefinitions._file_light.iconPath != null &&
            schema.iconDefinitions._file_light.iconPath !== '';
        const res = {
            // folders section
            folders: this.buildFolders(folders, iconsFolderBasePath, hasDefaultLightFolder),
            //  files section
            files: this.buildFiles(files, iconsFolderBasePath, hasDefaultLightFile),
        };
        // map structure to the schema
        schema.iconDefinitions = Object.assign({}, schema.iconDefinitions, res.folders.defs, res.files.defs);
        schema.folderNames = res.folders.names.folderNames;
        schema.folderNamesExpanded = res.folders.names.folderNamesExpanded;
        schema.fileExtensions = res.files.names.fileExtensions;
        schema.fileNames = res.files.names.fileNames;
        schema.languageIds = res.files.languageIds;
        schema.light.folderNames = res.folders.light.folderNames;
        schema.light.folderNamesExpanded = res.folders.light.folderNamesExpanded;
        schema.light.fileExtensions = res.files.light.fileExtensions;
        schema.light.fileNames = res.files.light.fileNames;
        schema.light.languageIds = res.files.light.languageIds;
        return schema;
    }
    hasCustomIcon(customIconFolderPath, filename) {
        const relativePath = this.getRelativePath('.', customIconFolderPath, false);
        const fpath = path.posix.join(relativePath, filename);
        return fs.existsSync(fpath);
    }
    getIconPath(defaultPath, filename) {
        const absPath = path.join(this.settings.vscodeAppData, this.settings.extensionSettings.customIconFolderName);
        if (!this.avoidCustomDetection && this.hasCustomIcon(absPath, filename)) {
            const sanitizedFolderPath = this.belongToSameDrive(absPath, this.manifestFolderPath)
                ? this.manifestFolderPath
                : this.overwriteDrive(absPath, this.manifestFolderPath);
            return this.getRelativePath(sanitizedFolderPath, absPath, false);
        }
        return defaultPath;
    }
    belongToSameDrive(path1, path2) {
        const [val1, val2] = this.getDrives(path1, path2);
        return val1 === val2;
    }
    overwriteDrive(sourcePath, destPath) {
        const [val1, val2] = this.getDrives(sourcePath, destPath);
        return destPath.replace(val2, val1);
    }
    getDrives(...paths) {
        const rx = new RegExp('^[a-zA-Z]:');
        return paths.map(x => (rx.exec(x) || [])[0]);
    }
    writeJsonToFile(json, iconsFilename, outDir) {
        try {
            if (!fs.existsSync(outDir)) {
                fs.mkdir(outDir);
            }
            fs.writeFileSync(path.join(outDir, iconsFilename), JSON.stringify(json, null, 2));
            // tslint:disable-next-line no-console
            console.log('Icons manifest file successfully generated!');
        }
        catch (error) {
            console.error('Something went wrong while generating the icon contribution file:', error);
        }
    }
    updatePackageJson(newIconThemesPath) {
        const oldIconThemesPath = packageJson.contributes.iconThemes[0].path;
        if (!oldIconThemesPath || (oldIconThemesPath === newIconThemesPath)) {
            return;
        }
        packageJson.contributes.iconThemes[0].path = newIconThemesPath;
        try {
            fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
            // tslint:disable-next-line no-console
            console.log('package.json updated');
        }
        catch (err) {
            console.error(err);
        }
    }
}
exports.IconGenerator = IconGenerator;
//# sourceMappingURL=iconGenerator.js.map