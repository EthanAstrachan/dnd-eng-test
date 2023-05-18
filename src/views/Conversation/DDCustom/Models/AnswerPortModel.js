import { DefaultPortModel } from "DDCanvas/main";

import {
  DEFAULT_CONDITION_VALUE,
  DEFAULT_CONDITION_DISPLAY,
  DEFAULT_CONDITTION_VARIABLE_VALUE,
  CONDITION_TYPE,
} from "./ConditionalNodeModel.js";

import _ from "lodash";

const DEFAULT_TIMEOUT = 5;

export const ANSWER_PORT_TYPE_OPEN = "OPEN";
export const ANSWER_PORT_TYPE_CLOSED = "CLOSED";
export const ANSWER_PORT_TYPE_TIMEOUT = "TIMEOUT";
export const ANSWER_PORT_TYPE_DEFAULT_CONDITION = "DEFAULT_CONDITION";
export const ANSWER_PORT_TYPE_CONDITION = "CONDITION";
export const ANSWER_PORT_TYPE_CLOSED_CONTROLLED = "CLOSED_CONTROLLED";
export const ANSWER_PORT_TYPE_DEFAULT_CLOSED = "DEFAULT_CLOSED";
export const HELPDESK_ACTION_TYPE = "HELPDESK_ACTION";
export const HELPDESK_TICKET_TYPE = "HELPDESK_TICKET";
export const SECOND_HSM_TYPE = "SECOND_HSM";

export class AnswerPortModel extends DefaultPortModel {
  constructor(
    text = "",
    answerType = ANSWER_PORT_TYPE_CLOSED,
    variable = "",
    controlledLength = null
  ) {
    super(false, "port-answer", text);
    this.answerType = answerType;
    this.timeout = DEFAULT_TIMEOUT;
    this.webhook = "";
    this.optOutWebhook = "";
    this.answerSubtype = "DEFAULT";
    this.conditionObject = {
      condition: {
        display: DEFAULT_CONDITION_DISPLAY,
        value: DEFAULT_CONDITION_VALUE,
      },
      value: DEFAULT_CONDITTION_VARIABLE_VALUE,
      variable: variable,
    };
    this.controlledLength = controlledLength;
    this.className = "AnswerPortModel";

    this.updateLabel = _.debounce(this.updateLabel, 1000);
    this.updateConditionValue = _.debounce(this.updateConditionValue, 1000);
    this.updateTimeConditionValue = _.debounce(
      this.updateTimeConditionValue,
      1000
    );
  }

  deSerialize(object) {
    _.forEach(this.ports, (port) => this.removePort(port));
    super.deSerialize(object);
    this.timeout = object.timeout;
    this.webhook = object.webhook;
    this.answerType = this.getAnswerTypeFromObject(object);
    this.conditionObject = object.conditionObject;
    this.answerSubtype = object.answerSubtype;
    this.optOutWebhook = object.optOutWebhook;
    this.controlledLength = object.controlledLength;
  }

  serialize() {
    return _.merge(super.serialize(), {
      timeout: this.timeout,
      webhook: this.webhook,
      answerType: this.answerType,
      conditionObject: this.conditionObject,
      answerSubtype: this.answerSubtype,
      optOutWebhook: this.optOutWebhook,
      controlledLength: this.controlledLength,
    });
  }

  getAnswerTypeFromObject(object) {
    if (
      object.answerType === ANSWER_PORT_TYPE_CLOSED &&
      object.label === "DEFAULT"
    ) {
      return ANSWER_PORT_TYPE_DEFAULT_CLOSED;
    }
    return object.answerType;
  }

  getControlledLength() {
    return this.controlledLength;
  }

  getType() {
    return this.answerType;
  }

  getTimeout() {
    return this.timeout;
  }

  setTimeout(timeout) {
    this.timeout = Number(timeout);
  }

  getIndex() {
    return this.getParent().getOrderedClosedPorts().indexOf(this) + 1;
  }

  getTargetNode() {
    const links = Object.values(this.getLinks());
    if (links.length == 0) return null;

    const link = links[0];
    const targetNode = link.getTargetPort()?.getParent();

    return targetNode;
  }

  getWebhook() {
    return this.webhook;
  }

  setWebhook(webhook) {
    this.webhook = webhook;
  }

  getOptoutWebhook() {
    return this.optOutWebhook;
  }

  setOptoutWebhook(webhook) {
    this.optOutWebhook = webhook;
  }

  getConditionObject() {
    return this.conditionObject;
  }

  setCondition(condition) {
    this.conditionObject["condition"] = condition;
    this.getParent().update("port-condition", condition);
  }

  updateConditionValue(value) {
    this.getParent().update("port-condition-value", value);
  }

  setConditionValue(value, debounce = true) {
    this.conditionObject["value"] = value;
    if (!debounce) {
      this.getParent().update("port-condition-value", value);
    } else {
      this.updateConditionValue(value);
    }
  }

  updateTimeConditionValue(value) {
    this.getParent().update("port-time-condition-value", value);
  }

  setTimeSinceConditionValue(value) {
    let tmpValue = null;
    if (Array.isArray(this.conditionObject["value"])) {
      tmpValue = [value, this.conditionObject["value"][1]];
    } else {
      tmpValue = [value, "23:59"];
    }
    this.conditionObject["value"] = tmpValue;
    this.updateTimeConditionValue(tmpValue);
  }

  setTimeUntilConditionValue(value) {
    let tmpValue = null;
    if (Array.isArray(this.conditionObject["value"])) {
      tmpValue = [this.conditionObject["value"][0], value];
    } else {
      tmpValue = ["00:00", value];
    }
    this.conditionObject["value"] = tmpValue;
    this.updateTimeConditionValue(tmpValue);
  }

  setConditionVariable(variable) {
    this.conditionObject["variable"] = variable;
  }

  setAnswerSubtype(type) {
    this.answerSubtype = type;
    if (type == "DEFAULT") {
      this.optOutWebhook = "";
    }
  }

  getLabel() {
    return this.label;
  }

  updateLabel(label) {
    this.getParent().update("port-label", label);
  }

  setLabel(label) {
    this.label = label;
    this.updateLabel(label);
  }

  isValidSchema() {
    if (
      !(
        this.answerType == ANSWER_PORT_TYPE_CONDITION ||
        this.answerType == ANSWER_PORT_TYPE_DEFAULT_CONDITION ||
        this.answerType == HELPDESK_ACTION_TYPE ||
        this.answerType == HELPDESK_TICKET_TYPE ||
        this.answerType == "OPEN"
      ) &&
      this.label === ""
    ) {
      return false;
    }

    return true;
  }

  getAPISchema(nodeIDToAPIID) {
    if (!this.isValidSchema()) {
      return null;
    }

    let targetNode = this.getTargetNode();

    let nextNodeId = -1;
    if (targetNode) nextNodeId = nodeIDToAPIID(this.getTargetNode().getID());

    let answer_type = "TEXT";
    if (this.label == "DEFAULT") answer_type = "DEFAULT";
    if (this.label == "[REQUEST_TRIGGER]") answer_type = "REQUEST_TRIGGER";

    let answer_subtype = this.answerSubtype ? this.answerSubtype : "DEFAULT";
    let optOutWebhook = this.optOutWebhook ? this.optOutWebhook : "";
    if (this.label == "[LOCATION]") answer_subtype = "LOCATION";

    if (
      this.answerType == ANSWER_PORT_TYPE_CONDITION ||
      this.answerType == ANSWER_PORT_TYPE_DEFAULT_CONDITION
    ) {
      return {
        expected_text: this.conditionObject["value"],
        next_node_id: nextNodeId,
        webhook: this.webhook ? this.webhook : "",
        response: "",
        answer_type: CONDITION_TYPE,
        condition_type:
          this.answerType == ANSWER_PORT_TYPE_DEFAULT_CONDITION
            ? "DEFAULT"
            : this.conditionObject["condition"]["value"],
        answer_subtype: answer_subtype,
      };
    }

    if (
      this.answerType == HELPDESK_ACTION_TYPE ||
      this.answerType == HELPDESK_TICKET_TYPE
    ) {
      return {
        expected_text: "",
        next_node_id: nextNodeId,
        webhook: this.webhook ? this.webhook : "",
        response: "",
        answer_type: this.answerType,
        answer_subtype: answer_subtype,
      };
    }

    return {
      expected_text: this.label,
      next_node_id: nextNodeId,
      webhook: this.webhook ? this.webhook : "",
      response: "",
      answer_type: answer_type,
      answer_subtype: answer_subtype,
      optout_webhook: optOutWebhook,
    };
  }
}
