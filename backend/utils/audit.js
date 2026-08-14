const AuditLog = require("../models/AuditLog");
function audit(actor, action, entity, entityId, oldValue, newValue) {
    return AuditLog.create({ actor, action, entity, entityId, oldValue, newValue }).catch((error) =>
        console.error("Audit log error:", error.message)
    );
}
module.exports = audit;
