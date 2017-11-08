"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
function AppendFieldsToObject(reference, obj) {
    // Make sure it is an object type
    if (typeof obj == 'object') {
        for (let referenceKey in reference) {
            // If key exists in original object and is an object. 
            if (obj.hasOwnProperty(referenceKey)) {
                obj[referenceKey] = AppendFieldsToObject(reference[referenceKey], obj[referenceKey]);
            }
            else {
                // Does not exist in current object context
                obj[referenceKey] = reference[referenceKey];
            }
        }
    }
    return obj;
}
// Combines two object's fields, giving the parentDefault a higher precedence. 
function MergeDefaults(parentDefault, childDefault) {
    let newDefault = {};
    for (let attrname in childDefault) {
        newDefault[attrname] = childDefault[attrname];
    }
    for (let attrname in parentDefault) {
        newDefault[attrname] = parentDefault[attrname];
    }
    return newDefault;
}
function UpdateDefaults(object, defaults) {
    if (defaults != null) {
        for (let key in object) {
            if (object[key].hasOwnProperty('type') && object[key].type === 'object' && object[key].properties !== null) {
                object[key].properties = UpdateDefaults(object[key].properties, MergeDefaults(defaults, object[key].default));
            }
            else if (key in defaults) {
                object[key].default = defaults[key];
            }
        }
    }
    return object;
}
function ReplaceReferences(definitions, objects) {
    for (let key in objects) {
        if (objects[key].hasOwnProperty('$ref')) {
            // $ref is formatted as "#/definitions/ObjectName"
            let referenceStringArray = objects[key]['$ref'].split('/');
            // Getting "ObjectName"
            let referenceName = referenceStringArray[referenceStringArray.length - 1];
            // Make sure reference has replaced its own $ref fields and hope there are no recursive references.
            definitions[referenceName] = ReplaceReferences(definitions, definitions[referenceName]);
            // Retrieve ObjectName from definitions. (TODO: Does not retrieve inner objects)
            // Need to deep copy, there are no functions in these objects.
            let reference = JSON.parse(JSON.stringify(definitions[referenceName]));
            objects[key] = AppendFieldsToObject(reference, objects[key]);
            // Remove $ref field
            delete objects[key]['$ref'];
        }
        // Recursively replace references if this object has properties. 
        if (objects[key].hasOwnProperty('type') && objects[key].type === 'object' && objects[key].properties !== null) {
            objects[key].properties = ReplaceReferences(definitions, objects[key].properties);
            objects[key].properties = UpdateDefaults(objects[key].properties, objects[key].default);
        }
    }
    return objects;
}
function GenerateOptionsSchema() {
    let packageJSON = JSON.parse(fs.readFileSync('package.json').toString());
    let schemaJSON = JSON.parse(fs.readFileSync('src/tools/OptionsSchema.json').toString());
    schemaJSON.definitions = ReplaceReferences(schemaJSON.definitions, schemaJSON.definitions);
    // Hard Code adding in configurationAttributes launch and attach.
    // .NET Core
    packageJSON.contributes.debuggers[0].configurationAttributes.launch = schemaJSON.definitions.LaunchOptions;
    packageJSON.contributes.debuggers[0].configurationAttributes.attach = schemaJSON.definitions.AttachOptions;
    // Full .NET Framework
    packageJSON.contributes.debuggers[1].configurationAttributes.launch = schemaJSON.definitions.LaunchOptions;
    packageJSON.contributes.debuggers[1].configurationAttributes.attach = schemaJSON.definitions.AttachOptions;
    let content = JSON.stringify(packageJSON, null, 2);
    if (os.platform() === 'win32') {
        content = content.replace(/\n/gm, "\r\n");
    }
    fs.writeFileSync('package.json', content);
}
exports.GenerateOptionsSchema = GenerateOptionsSchema;
//# sourceMappingURL=GenerateOptionsSchema.js.map