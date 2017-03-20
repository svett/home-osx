/**
 * Simple in-memory cache
 *
 * There are probably a lot of existing and much more advanced packages in npm,
 * but I had too much fun in implementing it on my own.
 */
"use strict";
var CacheItem = (function () {
    function CacheItem(key, value) {
        this._key = key;
        this._value = value;
        this.storeDate = new Date();
    }
    Object.defineProperty(CacheItem.prototype, "key", {
        get: function () {
            return this._key;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CacheItem.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: true,
        configurable: true
    });
    CacheItem.prototype.isExpired = function (expirationInterval) {
        return this.storeDate.getTime() + expirationInterval * 1000 < Date.now();
    };
    return CacheItem;
}());
exports.CacheItem = CacheItem;
var Cache = (function () {
    function Cache(cacheExpirationInterval) {
        this._store = {};
        this._cacheExpirationInterval = cacheExpirationInterval;
    }
    Cache.prototype.add = function (item) {
        this._store[item.key] = item;
    };
    Cache.prototype.get = function (key) {
        var item = this._store[key];
        // Check expiration
        if (typeof item === 'undefined' || item.isExpired(this._cacheExpirationInterval)) {
            return undefined;
        }
        else {
            return item.value;
        }
    };
    Cache.prototype.getCacheItem = function (key) {
        var item = this._store[key];
        // Check expiration
        if (typeof item === 'undefined' || item.isExpired(this._cacheExpirationInterval)) {
            return undefined;
        }
        else {
            return item;
        }
    };
    return Cache;
}());
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map