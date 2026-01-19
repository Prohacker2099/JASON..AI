"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEmotion = publishEmotion;
exports.publishSafety = publishSafety;
exports.publishPolicyEval = publishPolicyEval;
exports.publishSystemStatus = publishSystemStatus;
exports.publishUserInput = publishUserInput;
exports.publishAppContext = publishAppContext;
var MessageBus_1 = require("./MessageBus");
function publishEmotion(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'emotion', 'percept_bus', payload, 5, extra));
}
function publishSafety(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'safety', 'percept_bus', payload, 5, extra));
}
function publishPolicyEval(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'policy', 'percept_bus', payload, 5, extra));
}
function publishSystemStatus(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'system', 'percept_bus', payload, 5, extra));
}
function publishUserInput(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'user_input', 'percept_bus', payload, 5, extra));
}
function publishAppContext(payload, extra) {
    MessageBus_1.messageBus.publish((0, MessageBus_1.makeEnvelope)('PERCEPT', 'app_context', 'percept_bus', payload, 5, extra));
}
