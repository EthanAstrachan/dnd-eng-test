import React from "react";
import _ from "lodash";
import Textarea from "react-textarea-autosize";

import {
  ANSWER_PORT_TYPE_OPEN,
  ANSWER_PORT_TYPE_CLOSED,
  ANSWER_PORT_TYPE_TIMEOUT,
  ANSWER_PORT_TYPE_DEFAULT_CONDITION,
  ANSWER_PORT_TYPE_CONDITION,
  ANSWER_PORT_TYPE_CLOSED_CONTROLLED,
  ANSWER_PORT_TYPE_DEFAULT_CLOSED,
} from "../Models/AnswerPortModel";
import { HSMNodeModel } from "../Models/HSMNodeModel";
import SimpleTooltip from "../../SimpleTooltip";

import SelectDropdown from "Components/SelectDropdown";
import languages from "./languages.js";
import getLanguage from "getLanguage.js";
const language = languages[getLanguage()];

const DEFAULT_OPEN_TEXT = "ABIERTA";
const ANSWER_CLOSED_PLACEHOLDER = language.write;
const ANSWER_TIMEOUT_TEMPLATE = language.timeout;

const ANSWER_CLOSED_MENU_OPTION_CONFIGURATION = language.config;
const ANSWER_CLOSED_MENU_OPTION_DUPLICATE = language.duplicate;
const ANSWER_CLOSED_MENU_OPTION_DELETE = language.delete;

export default class AnswerPortWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      change: null,
    };

    this.onTextChange = this.onTextChange.bind(this);
    this.onTextChangeControlled = this.onTextChangeControlled.bind(this);
    this.onTextTimeoutChange = this.onTextTimeoutChange.bind(this);
    this.remove = this.remove.bind(this);
    this.removePort = this.removePort.bind(this);
    this.canDrag = false;
  }

  remove() {
    const { port, diagramEngine } = this.props;
    const node = port.getParent();

    node.removeAnswerClosedPort(port);

    diagramEngine.forceUpdate();
  }

  onTextChange({ target: { value } }) {
    this.props.port.setLabel(value);
    this.forceUpdate();
  }

  onTextChangeControlled(length, value) {
    let tempValue = value;
    let replacedValue = tempValue.replace(/([_*~].*[_*~])/g, "");
    if (replacedValue != tempValue) {
      tempValue = tempValue.replace(/[_*~]/g, "");
    }
    if (tempValue.length > length) return;
    this.props.port.setLabel(tempValue);
    this.forceUpdate();
  }

  onTextTimeoutChange({ target: { value } }) {
    const { port } = this.props;

    let newTimeout = value.replace(/\D/g, "");
    if (newTimeout == "") newTimeout = "0";

    port.setTimeout(newTimeout);

    this.forceUpdate();
  }

  renderAnswerPortOpen(port) {
    let node = port.getParent();

    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});

    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-open` // ${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
        >
          <div className="question--port open">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          <div className="answer-input-container">
            <p>{DEFAULT_OPEN_TEXT}</p>
          </div>
        </div>
      </div>
    );
  }

  renderAnswerPortClosed(port) {
    let node = port.getParent();
    let disabled = node instanceof HSMNodeModel;
    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});
    const { provided, innerRef } = this.props;
    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-closed` //${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
          ref={innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-portid={port.getID()}
        >
          <div className="question--port">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port closed ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          <div className="answer-input-container">
            <SimpleTooltip
              message={
                <>
                  <b>Click</b> {language.addBlock}
                </>
              }
              itemtohover={
                <span className="icon--plus closed-answer-icon"></span>
              }
              placement="bottom"
              onClick={() => {
                node.newClosedPortAfterPort(port);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
            <span className="numeration">{port.getIndex()}.</span>
            <Textarea
              id={port.getID()}
              className="answer-input"
              onChange={this.onTextChange}
              value={port.getLabel()}
              placeholder={ANSWER_CLOSED_PLACEHOLDER}
              disabled={disabled}
            />
            <SelectDropdown
              options={
                this.props.disabled
                  ? [ANSWER_CLOSED_MENU_OPTION_CONFIGURATION]
                  : [
                      ANSWER_CLOSED_MENU_OPTION_CONFIGURATION,
                      ANSWER_CLOSED_MENU_OPTION_DUPLICATE,
                      ANSWER_CLOSED_MENU_OPTION_DELETE,
                    ]
              }
              display={(item) => {
                let iconName = {
                  [ANSWER_CLOSED_MENU_OPTION_DUPLICATE]: "copy",
                  [ANSWER_CLOSED_MENU_OPTION_DELETE]: "trash",
                  [ANSWER_CLOSED_MENU_OPTION_CONFIGURATION]: "tool",
                };

                return [
                  <i className={`icon--${iconName[item]}`}></i>,
                  <p>{item}</p>,
                ];
              }}
              triggerComponent={
                <SimpleTooltip
                  message={
                    <>
                      <b>Click</b> {language.openMenu} <br className="small" />
                      <b>{language.drag}</b> {language.dragAction}
                    </>
                  }
                  itemtohover={
                    <span
                      onMouseEnter={() => {
                        this.canDrag = true;
                        this.props.changeDrag(this.canDrag);
                        this.props.diagramEngine.diagramModel.clearSelection(
                          false,
                          true
                        );
                      }}
                      onMouseLeave={() => {
                        this.canDrag = false;
                        this.props.changeDrag(this.canDrag);
                      }}
                      className="icon--handle closed-answer-icon"
                    ></span>
                  }
                  placement="right"
                />
              }
              onSelect={(item) => {
                if (item == ANSWER_CLOSED_MENU_OPTION_DELETE)
                  node.removePort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_DUPLICATE)
                  node.duplicateClosedPort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_CONFIGURATION)
                  this.props.selectNode(node);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  removePort(node, port, item) {
    node.removePort(port);
    this.props.diagramEngine.forceUpdate();
  }

  renderAnswerPortTimeout(port, secondHSM = false) {
    let node = port.getParent();
    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});
    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-timeout` // ${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
        >
          <div className="question--port">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port closed ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          {
            !secondHSM ? 
              <div className="answer-input-container">
                <AnswerPortWidgetTimeoutTextarea node={node} port={port} />
              </div> : 
              this.props.children
          }
          
        </div>
      </div>
    );
  }

  renderAnswerPortDefaultClosed(port) {
    let node = port.getParent();
    let isHsmNode = node instanceof HSMNodeModel;
    let dropdownMenu = null;

    if (!isHsmNode) {
      dropdownMenu = (
        <SelectDropdown
          options={[
            ANSWER_CLOSED_MENU_OPTION_CONFIGURATION,
            ANSWER_CLOSED_MENU_OPTION_DELETE,
          ]}
          display={(item) => {
            let iconName = {
              [ANSWER_CLOSED_MENU_OPTION_DELETE]: "trash",
              [ANSWER_CLOSED_MENU_OPTION_CONFIGURATION]: "tool",
            };

            return [
              <i className={`icon--${iconName[item]}`}></i>,
              <p>{item}</p>,
            ];
          }}
          triggerComponent={
            <SimpleTooltip
              message={
                <>
                  <b>Click</b> {language.openMenu}
                </>
              }
              itemtohover={
                <span className="icon--handle closed-answer-icon"></span>
              }
              placement="right"
            />
          }
          onSelect={(item) => {
            if (item == ANSWER_CLOSED_MENU_OPTION_DELETE) {
              node.removePort(port);
            }
            if (item == ANSWER_CLOSED_MENU_OPTION_CONFIGURATION) {
              this.props.selectNode(node);
            }
            this.props.diagramEngine.forceUpdate();
            this.props.nodeWidgetForceUpdate();
          }}
        />
      );
    }

    return (
      <div id="port-node-answer">
        <div className="answer-port port-closed">
          <div className="question--port">
            <div className="line"></div>
            <div
              className={`ball port`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            />
          </div>
          <div className="answer-input-container">
            <div className="answer-button active">{language.defaultAnswer}</div>
            {dropdownMenu}
          </div>
        </div>
      </div>
    );
  }

  renderAnswerPortDefaultCondition(port) {
    let node = port.getParent();
    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});
    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-closed` // ${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
        >
          <div className="question--port">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port closed ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          <div className="answer-input-container">
            <Textarea
              id={port.getID()}
              className="answer-input"
              value={port.label}
              disabled={true}
            />
          </div>
        </div>
      </div>
    );
  }

  renderCondition(condition, node) {
    if (node.getConditionalType() == "TIME") {
      return (
        <div className="condition-text">
          {"⏰ "}
          {language.timeCondition}
          {": "}
          <span className="variable">{condition["value"][0]}</span>
          {` ${language.to} `}
          <span className="variable">{condition["value"][1]}</span>{" "}
        </div>
      );
    }
    return (
      <div className="condition-text">
        <div>
          {"⚙️ "}
          {language.if}{" "}
        </div>
        <span className="variable">
          {"{"}
          {"{"}
          {condition["variable"]}
          {"}"}
          {"}"}
        </span>{" "}
        <div>{condition["condition"]["display"]} </div>
        <span className="value">{condition["value"]}</span>
      </div>
    );
  }

  renderAnswerPortCondition(port) {
    let node = port.getParent();
    const { provided, innerRef } = this.props;
    let condition = port.getConditionObject();
    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});
    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-closed` //${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
          ref={innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-portid={port.getID()}
        >
          <div className="question--port">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port closed ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          <div className="answer-input-container">
            <SimpleTooltip
              message={
                <>
                  <b>Click</b> {language.addBlock}
                </>
              }
              itemtohover={
                <span className="icon--plus closed-answer-icon"></span>
              }
              placement="bottom"
              onClick={() => {
                node.newClosedPortAfterPort(port);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
            {this.renderCondition(condition, node)}
            <div className="answer-input"></div>
            <SelectDropdown
              options={[
                ANSWER_CLOSED_MENU_OPTION_CONFIGURATION,
                ANSWER_CLOSED_MENU_OPTION_DUPLICATE,
                ANSWER_CLOSED_MENU_OPTION_DELETE,
              ]}
              display={(item) => {
                let iconName = {
                  [ANSWER_CLOSED_MENU_OPTION_DUPLICATE]: "copy",
                  [ANSWER_CLOSED_MENU_OPTION_DELETE]: "trash",
                  [ANSWER_CLOSED_MENU_OPTION_CONFIGURATION]: "tool",
                };

                return [
                  <i className={`icon--${iconName[item]}`}></i>,
                  <p>{item}</p>,
                ];
              }}
              triggerComponent={
                <SimpleTooltip
                  message={
                    <>
                      <b>Click</b> {language.openMenu} <br className="small" />
                      <b>{language.drag}</b> {language.dragAction}
                    </>
                  }
                  itemtohover={
                    <span
                      onMouseEnter={() => {
                        this.canDrag = true;
                        this.props.changeDrag(this.canDrag);
                        this.props.diagramEngine.diagramModel.clearSelection(
                          false,
                          true
                        );
                      }}
                      onMouseLeave={() => {
                        this.canDrag = false;
                        this.props.changeDrag(this.canDrag);
                      }}
                      className="icon--handle closed-answer-icon"
                    ></span>
                  }
                  placement="right"
                />
              }
              onSelect={(item) => {
                if (item == ANSWER_CLOSED_MENU_OPTION_DELETE)
                  node.removePort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_DUPLICATE)
                  node.duplicateClosedPort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_CONFIGURATION)
                  this.props.selectNode(node);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  renderAnswerPortClosedControlled(port) {
    let node = port.getParent();
    const { provided, innerRef } = this.props;
    const showLinkRoute = port.getShowLinkRoute() && !_.isEqual(port.links, {});
    return (
      <div id="port-node-answer">
        <div
          className={
            `answer-port port-closed` //${extraClass}` //+ (this.state.editing ? "editing" : "")
          }
          ref={innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-portid={port.getID()}
        >
          <div className="question--port">
            <div className="line"></div>
            <div
              onMouseEnter={() => {
                if (!_.isEqual(port.links, {}) && !port.getShowLinkRoute()) {
                  port.setShowLinkRoute(true);
                  this.forceUpdate();
                }
              }}
              onMouseLeave={() => {
                if (port.getShowLinkRoute()) {
                  port.setShowLinkRoute(false);
                  this.forceUpdate();
                }
              }}
              className={`ball port closed ${showLinkRoute ? "show-link" : ""}`}
              data-name={port.getID()}
              data-nodeid={node.getID()}
              id={port.getID()}
            >
              {showLinkRoute && <div className="icon icon--arrow-forward" />}
            </div>
          </div>
          <div className="answer-input-container">
            <SimpleTooltip
              message={
                <>
                  <b>Click</b> {language.addBlock}
                </>
              }
              itemtohover={
                <span className="icon--plus closed-answer-icon"></span>
              }
              placement="bottom"
              onClick={() => {
                node.newClosedPortAfterPort(port);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
            <span className="numeration">{port.getIndex()}.</span>
            <Textarea
              id={port.getID()}
              className="answer-input"
              onChange={({ target: { value } }) => {
                this.onTextChangeControlled(port.getControlledLength(), value);
              }}
              value={port.label}
              placeholder={ANSWER_CLOSED_PLACEHOLDER}
            />
            <SelectDropdown
              options={[
                ANSWER_CLOSED_MENU_OPTION_CONFIGURATION,
                ANSWER_CLOSED_MENU_OPTION_DUPLICATE,
                ANSWER_CLOSED_MENU_OPTION_DELETE,
              ]}
              display={(item) => {
                let iconName = {
                  [ANSWER_CLOSED_MENU_OPTION_DUPLICATE]: "copy",
                  [ANSWER_CLOSED_MENU_OPTION_DELETE]: "trash",
                  [ANSWER_CLOSED_MENU_OPTION_CONFIGURATION]: "tool",
                };

                return [
                  <i className={`icon--${iconName[item]}`}></i>,
                  <p>{item}</p>,
                ];
              }}
              triggerComponent={
                <SimpleTooltip
                  message={
                    <>
                      <b>Click</b> {language.openMenu} <br className="small" />
                      <b>{language.drag}</b> {language.dragAction}
                    </>
                  }
                  itemtohover={
                    <span
                      onMouseEnter={() => {
                        this.canDrag = true;
                        this.props.changeDrag(this.canDrag);
                        this.props.diagramEngine.diagramModel.clearSelection(
                          false,
                          true
                        );
                      }}
                      onMouseLeave={() => {
                        this.canDrag = false;
                        this.props.changeDrag(this.canDrag);
                      }}
                      className="icon--handle closed-answer-icon"
                    ></span>
                  }
                  placement="right"
                />
              }
              onSelect={(item) => {
                if (item == ANSWER_CLOSED_MENU_OPTION_DELETE)
                  node.removePort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_DUPLICATE)
                  node.duplicateClosedPort(port);
                if (item == ANSWER_CLOSED_MENU_OPTION_CONFIGURATION)
                  this.props.selectNode(node);
                this.props.diagramEngine.forceUpdate();
                this.props.nodeWidgetForceUpdate();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { port, secondHSM } = this.props;
    if (port.answerType == ANSWER_PORT_TYPE_OPEN)
      return this.renderAnswerPortOpen(port);
    if (port.answerType == ANSWER_PORT_TYPE_CLOSED)
      return this.renderAnswerPortClosed(port);
    if (port.answerType == ANSWER_PORT_TYPE_TIMEOUT)
      return this.renderAnswerPortTimeout(port, secondHSM);
    if (port.answerType == ANSWER_PORT_TYPE_DEFAULT_CONDITION)
      return this.renderAnswerPortDefaultCondition(port);
    if (port.answerType == ANSWER_PORT_TYPE_CONDITION)
      return this.renderAnswerPortCondition(port);
    if (port.answerType == ANSWER_PORT_TYPE_CLOSED_CONTROLLED)
      return this.renderAnswerPortClosedControlled(port);
    if (port.answerType == ANSWER_PORT_TYPE_DEFAULT_CLOSED)
      return this.renderAnswerPortDefaultClosed(port);
  }
}

export class AnswerPortWidgetTimeoutTextarea extends React.Component {
  constructor(props) {
    super(props);

    this.onTextChange = this.onTextChange.bind(this);
    this.displayText = this.displayText.bind(this);
  }

  onTextChange({ target: { value } }) {
    const { port } = this.props;

    let newTimeout = value.replace(/\D/g, "");
    if (newTimeout == "") newTimeout = "0";

    port.setTimeout(newTimeout);

    this.forceUpdate();
  }

  displayText() {
    const { port } = this.props;

    return ANSWER_TIMEOUT_TEMPLATE.replace("{{min}}", port.timeout);
  }

  render() {
    const { port, node } = this.props;

    return (
      <Textarea
        id={port.getID()}
        className="answer-input answer-timeout-text-area"
        onChange={this.onTextChange}
        value={this.displayText()}
        placeholder={ANSWER_CLOSED_PLACEHOLDER}
        onFocus={() => (node.editing = true)}
        onBlur={() => (node.editing = false)}
      />
    );
  }
}
