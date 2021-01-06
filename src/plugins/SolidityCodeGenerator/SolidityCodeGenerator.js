/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Wed Sep 20 2017 23:32:57 GMT-0500 (CDT).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'q',
    'common/util/ejs',
    'scsrc/util/utils',
    'scsrc/templates/ejsCache',
    'scsrc/parsers/solidityExtra'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    Q,
    ejs,
    utils,
    ejsCache,
    solidityParser) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of SolidityCodeGenerator.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin SolidityCodeGenerator.
     * @constructor
     */
    var SolidityCodeGenerator = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    SolidityCodeGenerator.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    SolidityCodeGenerator.prototype = Object.create(PluginBase.prototype);
    SolidityCodeGenerator.prototype.constructor = SolidityCodeGenerator;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    SolidityCodeGenerator.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
          nodes,
          artifact;

        self.loadNodeMap(self.activeNode)
           .then(function (nodes_) {
            nodes = nodes_;
            return SolidityCodeGenerator.getGeneratedFiles(self, nodes, self.activeNode);
        })
        .then(function (result) {
            
            console.log(result);
            console.log(result.violations.length);
            if (result.violations.length > 0) {
                result.violations.forEach(function (violation) {
                    self.createMessage(violation.node, violation.message, 'error');
                });
                throw new Error('Model has ' + result.violations.length + ' violation(s). ' +
                'See messages for details.');
            }

            artifact = self.blobClient.createArtifact('SolidityContract');
            return artifact.addFiles(result.files);
        })
        .then(function (fileHashes) {
            fileHashes.forEach(function (fileHash) {
                self.result.addArtifact(fileHash);
            });

            return artifact.save();
        })
        .then(function (artifactHash) {
            self.result.addArtifact(artifactHash);
            self.result.setSuccess(true);
            callback(null, self.result);
        })
        .catch(function (err) {
            self.logger.error(err.stack);
            // Result success is false at invocation.
            callback(err, self.result);
        });
    };

    /**
     *
     * @param {PluginBase} self - An initialized and configured plugin.
     * @param {Object<string, Object>} nodes - all nodes loaded from the projectNode.
     * @param {object} activeNode - the projectNode.
     *
     * @returns {fileContent: string, violations: Objects[]}
     */
    SolidityCodeGenerator.getGeneratedFiles = function (self, nodes, activeNode, callback) {
        var contractPaths = SolidityCodeGenerator.prototype.getContractPaths.call(self, nodes),
            violations = SolidityCodeGenerator.prototype.getViolations.call(self, contractPaths, nodes),
            fileNames = [],
            fileName,
            promises = [],
            type;

        for (type of contractPaths) {
            fileName = self.core.getAttribute(nodes[type], 'name') + '.sol';
            fileNames.push(fileName);
            promises.push(SolidityCodeGenerator.prototype.getContractFile.call(self, nodes[type], violations));
        }

        return Q.all(promises)
            .then(function (result) {
                var i,
                    files = {};

                for (i = 0; i < fileNames.length; i += 1) {
                    files[fileNames[i]] = result[i];
                }

                return {
                    files: files,
                    violations: violations
                };
            })
            .nodeify(callback);
    };

    SolidityCodeGenerator.prototype.getContractPaths = function (nodes) {
        var self = this,
            path,
            node,
            //Using an array for the multiple contracts extention
            contracts = [];

        for (path in nodes) {
            node = nodes[path];
            if (self.isMetaTypeOf(node, self.META.Contract)) {
                contracts.push(path);
            }
        }
        return contracts;
    };

    SolidityCodeGenerator.prototype.getContractFile = function (contractNode, violations, callback) {
        var self = this,
            fileContent,
            i;

        return utils.getModelOfContract(self.core, contractNode)
            .then(function (contractModel) {
                fileContent = ejs.render(ejsCache.contractType.complete, contractModel);

              var parseResult = solidityParser.checkWholeFile(fileContent);
                // if (parseResult) {
                //     self.logger.debug(parseResult.line);
                //     self.logger.debug(parseResult.message);
                //     parseResult.node = contractNode;
                //     violations.push(parseResult);
                // }
                return fileContent;
            })
            .nodeify(callback);
    };

    SolidityCodeGenerator.prototype.getViolations = function (contracts, nodes) {
        var contractNames = {},
            name, type, node,
            child, childPath, childName,
            self = this,
            noInitialState,
            nameAndViolations = {
                violations: [],
                totalStateNames: {},
                transitionNames: {},
                guardNames: {}
            };
        for (type of contracts) {
            //nameAndViolations.guardNames = {};
            nameAndViolations.totalStateNames = {};
            nameAndViolations.transitionNames = {};
            noInitialState = true;
            node = nodes[type];
            name = self.core.getAttribute(node, 'name');
            if (contractNames.hasOwnProperty(name)) {
                nameAndViolations.violations.push({
                    node: node,
                    message: 'Name [' + name + '] of contract [' + type + '] is not unique. Please rename. ' +
                    'Contracts must have unique names. '
                });
            }
            contractNames[name] = self.core.getPath(node);
            for (childPath of self.core.getChildrenPaths(node)) {
                child = nodes[childPath];
                childName = self.core.getAttribute(child, 'name');
                if ((self.isMetaTypeOf(child, self.META.InitialState))) {
                    noInitialState = false;
                }
                nameAndViolations = SolidityCodeGenerator.prototype.hasChildViolations.call(self, child, childName, nameAndViolations);
            }
            if (noInitialState) {
                nameAndViolations.violations.push({
                    node: node,
                    message: 'Contract type [' + name + '] does not have an initial state. ' +
                    'Please define an initial state.'
                });
            }
        }
        return nameAndViolations.violations;
    };

    SolidityCodeGenerator.prototype.hasChildViolations = function (child, childName, nameAndViolations) {
        var self = this;

        if ((self.isMetaTypeOf(child, self.META.State)) || (self.isMetaTypeOf(child, self.META.InitialState))) {
            if (nameAndViolations.totalStateNames.hasOwnProperty(childName)) {
                nameAndViolations.violations.push({
                    node: child,
                    message: 'Name [' + childName + '] of state [' + child + '] is not unique. ' +
                    'Please rename. States that belong to the same contract must have unique names.'
                });
            }
            nameAndViolations.totalStateNames[childName] = self.core.getPath(child);
        }
        if (self.isMetaTypeOf(child, self.META.Transition)) {

            if (this.core.getPointerPath(child, 'dst') === null) {
                nameAndViolations.violations.push({
                    node: child,
                    message: 'Transition [' + childName + '] with no destination encountered. ' +
                    'Please connect or remove it.'
                });
            }
            if (this.core.getPointerPath(child, 'src') === null) {
                nameAndViolations.violations.push({
                    node: child,
                    message: 'Transition [' + childName + '] with no source encountered. Please connect or remove it.'
                });
            }
            if (!self.core.getAttribute(child, 'tags').match(/^(payable|admin|event|public|view|\s|)+$/)){
              nameAndViolations.violations.push({
                  node: child,
                  message: 'Transition [' + childName + '] has invalid tags. Tags can only be any combination of "payable", "admin", and "event".'
              });
            }
        }
        if (self.isMetaTypeOf(child, self.META.Transition)) {

            if (nameAndViolations.transitionNames.hasOwnProperty(childName)) {
                nameAndViolations.violations.push({
                    node: child,
                    message: 'Name [' + childName + '] of transition is not unique. ' +
                    'Please rename. Transitions of the same contract ' +
                    'type must have distinct names.'
                });
            }
            nameAndViolations.transitionNames[childName] = self.core.getPath(child);
        }
        return nameAndViolations;
    };



    return SolidityCodeGenerator;
});
