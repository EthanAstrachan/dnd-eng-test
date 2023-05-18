import { QuestionNodeModel } from "./QuestionNodeModel";
import _ from "lodash";
import {
  AnswerPortModel,
  ANSWER_PORT_TYPE_OPEN,
  ANSWER_PORT_TYPE_CLOSED,
  ANSWER_PORT_TYPE_DEFAULT_CLOSED,
  ANSWER_PORT_TYPE_TIMEOUT,
  SECOND_HSM_TYPE,
} from "./AnswerPortModel";

import { DEFAULT_TIMER_VALUE, SECONDS_TIMER } from "./QuestionNodeModel";

import configLanguages from "../../languages";
import getLanguage from "getLanguage.js";
import constants from "assets/constants.js";
import {LinkModel} from "../../../../DDCanvas/Common";

const VAR_TEXT = "TEXT";
const VAR_ALL = "ALL";
const VAR_EMAIL = "EMAIL";
const VAR_ZIPCODE = "ZIPCODE";
const VAR_NUMERIC = "NUMERIC";

const NO_MESSAGE_LIMIT = "NO_MESSAGE_LIMIT";
const MESSAGE_LIMIT = "MESSAGE_LIMIT";
const DEFAULT_MESSAGE_LIMIT = 2;

const HSM_TYPE_OPEN = "OPEN";

const configLanguage = configLanguages[getLanguage()];

export class HSMNodeModel extends QuestionNodeModel {
  constructor(hsm = { content: "", type: HSM_TYPE_OPEN, answers: [], isSecondHSM: false, parentHSMId: null}) {
    super(hsm.content);
    //this.removePort(this.getInPort());

    this.nodeType = "default-question-hsm";
    this.className = "HSMNodeModel";
    // open question
    if (hsm.type === HSM_TYPE_OPEN) {
      super.addPort(new AnswerPortModel("", ANSWER_PORT_TYPE_OPEN));
    }
    // closed question
    else {
      hsm.answers.forEach((answer) => {
        const answerType =
          answer !== "DEFAULT"
            ? ANSWER_PORT_TYPE_CLOSED
            : ANSWER_PORT_TYPE_DEFAULT_CLOSED;
        super.addPort(new AnswerPortModel(answer, answerType));
      });
    }
    this.hsm = hsm;
    this.webhookRead = null;
    this.webhookDelivered = null;
    this.saveOnVariable = null;
    this.saveOnVariableType = null;
    this.orderedClosedPorts = [];
    this.secondHSM = {
      secondHSMContent: null,
      secondHSMSendTime: null,
      secondHSMNodeId: null,
    }
    this.isSecondHSM = hsm.isSecondHSM;
    this.parentHSMId = hsm.parentHSMId;
  }

  deSerialize(object) {
    super.deSerialize(object);
    this.hsm = object.hsm;
    this.secondHSM = object.secondHSM;
    this.isSecondHSM = object.isSecondHSM;
    this.parentHSMId = object.parentHSMId;
  }

  serialize() {
    return _.merge(super.serialize(), {
      hsm: this.hsm,
      secondHSM: this.secondHSM,
      isSecondHSM: this.isSecondHSM,
      parentHSMId: this.parentHSMId,
    });
  }
  setMessageLimitAndTimerDefault() {
    this.messageLimit = {
      display: configLanguage.noMessageLimit,
      value: NO_MESSAGE_LIMIT,
    };
    this.messageLimitValue = DEFAULT_MESSAGE_LIMIT;
    this.timerValue = DEFAULT_TIMER_VALUE;
    this.timer = {
      display: configLanguage.seconds,
      value: SECONDS_TIMER,
    };
  }

  clearMessageLimitAndTimer() {
    this.messageLimit = null;
    this.messageLimitValue = null;
    this.timer = null;
    this.timerValue = null;
  }

  setDefaultSaveOnVariable() {
    this.saveOnVariable = "";
    this.saveOnVariableType = {
      display: configLanguage.allVarTypes,
      value: VAR_ALL,
    };
  }

  resetSaveOnVariable() {
    this.saveOnVariable = null;
    this.saveOnVariableType = null;
  }

  setWebhookValue(key, value) {
    if (key === "read") {
      this.webhookRead = value;
    }
    if (key === "delivered") {
      this.webhookDelivered = value;
    }
  }

  setInitialWebhookValues() {
    this.webhookRead = "";
    this.webhookDelivered = "";
  }

  clearWebhookValues() {
    this.webhookRead = null;
    this.webhookDelivered = null;
  }

  setSaveOnVariable(variable) {
    this.saveOnVariable = variable;
  }

  setSaveOnVariableType(type) {
    this.saveOnVariableType = type;
  }

  getOrderedClosedPorts() {
    if (!this.hsm.answers || !this.hsm.answers.length) return [];

    const closedPorts = this.getAnswerClosedPorts();

    const portsByContent = {};
    closedPorts.forEach((port) => (portsByContent[port.label] = port));
    return this.hsm.answers
      .filter((answer) => answer !== "DEFAULT")
      .map((answer) => portsByContent[answer]);
  }

  addAnswerClosedPort() {}

  removeAnswerClosedPort(port) {}

  setText(text) {}

  setAreHiddenClosedAnswers(val) {}

  addNotAnswerTimeoutPort(timeout) {
    if (this.getNotAnswerTimeoutPort()) return;

    const timeoutPort = new AnswerPortModel("", ANSWER_PORT_TYPE_TIMEOUT);
    timeoutPort.setTimeout(timeout);
    
    this.addPort(timeoutPort);
  }

  getAnswerClosedPorts() {
    const outPorts = Object.values(this.getPorts()).filter(
      (port) => port.in == false
    );
    return outPorts.filter(
      (port) => port.answerType === ANSWER_PORT_TYPE_CLOSED
    );
  }

  hasButtonLink() {
    return this.hsm.buttons?.options?.some(
      (button) => button.target_url !== undefined
    );
  }

  getSecondHSM() {
    return this.secondHSM;
  }

  getSecondHSMPort() {
    const outPorts = Object.values(this.getPorts()).filter(
      (port) => port.in == false
    );
    return outPorts.filter(
      (port) => port.answerType === SECOND_HSM_TYPE
    );
  }

  addSecondHSM(node, time, secondNodeId) {
    this.secondHSM = {
      secondHSMContent: node.serialize(),
      secondHSMSendTime: time,
      secondHSMNodeId: secondNodeId
    }

    const value = parseInt(time.value)
    const timeout = time.type === configLanguage.minutes ? value : value * 60;
    this.addNotAnswerTimeoutPort(timeout);
  }

  addSecondHSMLink(diagramEngine) {
    const link = new LinkModel();
    const outPorts = Object.values(this.getPorts()).filter(
      (port) => port.in == false
    );

    const timeoutPorts = outPorts.filter(
      (port) => port.answerType === ANSWER_PORT_TYPE_TIMEOUT
    ); 

    link.setSourcePort(timeoutPorts[0])
    let diagramModel = diagramEngine.getDiagramModel();
    const secondHSMContent = diagramModel.getNode(this.secondHSM.secondHSMNodeId);
    // secondHSMContent.deSerialize(this.secondHSM.secondHSMContent)
    const inPorts = Object.values(secondHSMContent.getPorts()).filter(
      (port) => port.in == true
    );
    link.setTargetPort(inPorts[0])
    diagramModel.addLink(link);
    diagramEngine.forceUpdate();
  }

  deleteSecondHSM() {
    this.secondHSM = {
      secondHSMContent: null,
      secondHSMSendTime: null,
      secondHSMNodeId: null,
    }
  }

  getAPISchema(nodeIDToAPIID) {
    let apiSchema = {
      id: nodeIDToAPIID(this.getID()),
      question_type: this.hsm.type,
      text: this.hsm.content,
      options: {},
      visible_options: true,
      webhook_read: this.webhookRead ? this.webhookRead : "",
      webhook_delivered: this.webhookDelivered ? this.webhookDelivered : "",
      hsm_id: this.hsm.id,
    };

    if (this.hsm.type == HSM_TYPE_OPEN) {
      apiSchema["answers"] = [
        this.getAnswerOpenPort().getAPISchema(nodeIDToAPIID),
      ];
    } else {
      const answerSchemas = this.getAnswerClosedPorts().map((port) =>
        port.getAPISchema(nodeIDToAPIID)
      );
      // Default answer
      const defaultPort = this.getDefaultClosedAnswerPort();
      if (defaultPort) {
        answerSchemas.push(defaultPort.getAPISchema(nodeIDToAPIID));
      }
      apiSchema["answers"] = answerSchemas;
    }

    if (this.goalMeasurement.targetEvents.length > 0) {
      apiSchema["target_properties"] = {
        campaign_goal: this.goalMeasurement.campaignGoal,
        target_events: this.goalMeasurement.targetEvents.map((target) => {
          const targetEvent = {
            type: target.type,
          };
          if (
            [
              constants.TARGET_EVENT_BUTTON_LINK,
              constants.TARGET_EVENT_LINK,
            ].includes(target.type)
          ) {
            targetEvent["url"] = target.url;
            targetEvent["expectation_number"] = target.expectationValue;
          }
          return targetEvent;
        }),
      };
    }

    if (this.saveOnVariable && this.saveOnVariableType) {
      apiSchema["save_on_classified_on_key"] = this.saveOnVariable;
      let variableType = this.saveOnVariableType.value;
      if (variableType) {
        let subtypeVariables = [VAR_EMAIL, VAR_ZIPCODE, VAR_NUMERIC];
        if (subtypeVariables.includes(variableType)) {
          apiSchema["save_on_classified_type"] = VAR_TEXT;
          apiSchema["save_on_classified_subtype"] = variableType;
        } else {
          apiSchema["save_on_classified_type"] = variableType;
        }
      }
    }

    const timeoutPort = this.getNotAnswerTimeoutPort();
    if (timeoutPort) {
      let targetNode = timeoutPort.getTargetNode();

      if (targetNode) {
        apiSchema["question_not_answer_timeout"] = {
          seconds: timeoutPort.getTimeout() * 60,
          to_question_id: nodeIDToAPIID(targetNode.getID()),
          webhook: timeoutPort.getWebhook(),
        };
      }
    }
    return apiSchema;
  }
}
