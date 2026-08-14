const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });
schema.index({ entity: 1, entityId: 1, createdAt: -1 });
module.exports = mongoose.model("AuditLog", schema);
