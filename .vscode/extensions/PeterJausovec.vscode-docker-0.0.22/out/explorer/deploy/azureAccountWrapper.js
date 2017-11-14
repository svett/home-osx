"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const azure_arm_resource_1 = require("azure-arm-resource");
class NotSignedInError extends Error {
}
exports.NotSignedInError = NotSignedInError;
class CredentialError extends Error {
}
exports.CredentialError = CredentialError;
class AzureAccountWrapper {
    constructor(extensionConext, azureAccount) {
        this.extensionConext = extensionConext;
        this.accountApi = azureAccount;
    }
    getAzureSessions() {
        const status = this.signInStatus;
        if (status !== 'LoggedIn') {
            throw new NotSignedInError(status);
        }
        return this.accountApi.sessions;
    }
    getCredentialByTenantId(tenantId) {
        const session = this.getAzureSessions().find((s, i, array) => s.tenantId.toLowerCase() === tenantId.toLowerCase());
        if (session) {
            return session.credentials;
        }
        throw new CredentialError(`Failed to get credential, tenant ${tenantId} not found.`);
    }
    get signInStatus() {
        return this.accountApi.status;
    }
    getFilteredSubscriptions() {
        return this.accountApi.filters.map(filter => {
            return {
                id: filter.subscription.id,
                subscriptionId: filter.subscription.subscriptionId,
                tenantId: filter.session.tenantId,
                displayName: filter.subscription.displayName,
                state: filter.subscription.state,
                subscriptionPolicies: filter.subscription.subscriptionPolicies,
                authorizationSource: filter.subscription.authorizationSource
            };
        });
    }
    getAllSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.accountApi.subscriptions.map(({ session, subscription }) => (Object.assign({ tenantId: session.tenantId }, subscription)));
        });
    }
    getLocationsBySubscription(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            const credential = this.getCredentialByTenantId(subscription.tenantId);
            const client = new azure_arm_resource_1.SubscriptionClient(credential);
            const locations = (yield client.subscriptions.listLocations(subscription.subscriptionId));
            return locations;
        });
    }
    registerSessionsChangedListener(listener, thisArg) {
        return this.accountApi.onSessionsChanged(listener, thisArg, this.extensionConext.subscriptions);
    }
    registerFiltersChangedListener(listener, thisArg) {
        return this.accountApi.onFiltersChanged(listener, thisArg, this.extensionConext.subscriptions);
    }
}
exports.AzureAccountWrapper = AzureAccountWrapper;
//# sourceMappingURL=azureAccountWrapper.js.map