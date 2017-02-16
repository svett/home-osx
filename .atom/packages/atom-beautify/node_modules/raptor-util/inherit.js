function inherit(ctor, superCtor, copyProps) {
    var oldProto = ctor.prototype;
    var newProto = ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            writable: true,
            configurable: true
        }
    });
    if (oldProto && copyProps !== false) {
        var propertyNames = Object.getOwnPropertyNames(oldProto);
        for (var i = 0; i < propertyNames.length; i++) {
            var name = propertyNames[i];
            var descriptor = Object.getOwnPropertyDescriptor(oldProto, name);
            Object.defineProperty(newProto, name, descriptor);
        }
    }
    ctor.$super = superCtor;
    ctor.prototype = newProto;
    return ctor;
}


module.exports = inherit;
inherit._inherit = inherit;
