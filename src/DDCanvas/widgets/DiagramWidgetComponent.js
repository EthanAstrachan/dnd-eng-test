import React from "react";
import _ from "lodash";
import { DiagramModel } from "../DiagramModel";
import {
  PointModel,
  NodeModel,
  NodePortModel,
  LinkModel,
  PortModel,
} from "../Common";
import {
  SelectingAction,
  MoveCanvasAction,
  MoveItemsAction,
  DragAnswerAction,
} from "./actions";
import { LinkLayerWidget } from "./LinkLayerWidget";
import { NodeLayerWidget } from "./NodeLayerWidget";
import { Toolkit } from "../Toolkit";
import events from "utils/events";
import {
  TWO_BLOCK_MINIMUM,
  EMOJIS,
  checkEmoji,
  SHORT_TEXT,
  checkShortText,
  GOAL_BLOCK,
  checkGoalBlock,
  BUTTONS_BLOCK,
  checkDefaultAnswer,
  NOT_INCLUDED_ANSWER,
} from "utils/scoreChecks";

import { zoomToContent } from "./DiagramWidgetUtils";

const DEFAULT_ACTIONS = {
  deleteItems: true,
  selectItems: true,
  moveItems: true,
  multiselect: true,
  multiselectDrag: true,
  canvasDrag: true,
  zoom: true,
  copy: true,
  paste: true,
  selectAll: true,
  deselectAll: true,
};

const PASTE_OFFSET = 50;

export class DiagramWidgetComponent extends React.Component {
  static defaultProps = {
    onChange: () => {},
    actions: DEFAULT_ACTIONS,
  };

  getActions() {
    if (this.props.actions === null) {
      return {};
    }
    return { ...DEFAULT_ACTIONS, ...(this.props.actions || {}) };
  }

  constructor(props) {
    super(props);
    this.state = {
      action: null,
      actionType: "unknown",
      renderedNodes: false,
      windowListener: null,
      clipboard: null,
      keyDown: null,
      highlightedModel: null,
      error: null,
    };

    this.wrapperRef = React.createRef();
  }

  componentWillUnmount() {
    this.props.diagramEngine.setCanvas(null);
    window.removeEventListener("keydown", this.state.windowListener);
  }

  componentDidUpdate() {
    if (this.props.diagramEngine.diagramModel.rendered == false) {
      this.props.diagramEngine.diagramModel.rendered = true;
      this.forceUpdate();
    }

    if (!this.state.renderedNodes) {
      this.setState({
        renderedNodes: true,
      });
    }

    this.recommendationChecks();
  }

  recommendationChecks = () => {
    const recommendations = this.props.recommendations;
    let diagramModel = this.props.diagramEngine.diagramModel;
    let nodes = diagramModel.getNodes();
    let nodesCount = Object.values(nodes).length;
    if (nodesCount > 0 && nodesCount <= 100) {
      let buttonsCount = 0;
      let goalBlockCheck = false;
      let emojiCount = 0;
      let defaultAnswerCheck = false;
      let shortTextCheck = false;
      let questionCount = 0;
      let closedQuestionCount = 0;
      let hsmCount = 0;

      Object.values(nodes).forEach((node) => {
        const nodeType = node.nodeType;
        if (nodeType === "default-question-hsm") {
          hsmCount++;
          // Check for goal block
          if (!goalBlockCheck) {
            if (checkGoalBlock(node)) {
              goalBlockCheck = true;
            }
          }
          return;
        } else if (
          [
            "default-question-open",
            "default-question-closed",
            "default-question-closed-buttons",
            "default-question-closed-list",
          ].includes(nodeType)
        ) {
          questionCount++;
          const nodeText = node.getText();
          // Check for emojis
          if (checkEmoji(nodeText)) {
            emojiCount++;
          }
          // Check for short texts
          if (!shortTextCheck) {
            if (!checkShortText(nodeText)) {
              shortTextCheck = true;
            }
          }
          // Check for goal block
          if (!goalBlockCheck) {
            if (checkGoalBlock(node)) {
              goalBlockCheck = true;
            }
          }
          // Check for buttons
          if (
            [
              "default-question-closed-buttons",
              "default-question-closed-list",
            ].includes(nodeType)
          ) {
            buttonsCount++;
          }
          // Check for default answer
          if (
            [
              "default-question-closed",
              "default-question-closed-buttons",
              "default-question-closed-list",
            ].includes(nodeType)
          ) {
            closedQuestionCount++;
            if (!defaultAnswerCheck) {
              if (!checkDefaultAnswer(node)) {
                defaultAnswerCheck = true;
              }
            }
          }
        }
      });

      // Check if at least two nodes
      if (!recommendations.TWO_BLOCK_MINIMUM && questionCount + hsmCount >= 2) {
        this.props.setCompleteRecommendation(TWO_BLOCK_MINIMUM, true);
      } else if (
        recommendations.TWO_BLOCK_MINIMUM &&
        questionCount + hsmCount < 2
      ) {
        this.props.setCompleteRecommendation(TWO_BLOCK_MINIMUM, false);
      }

      if (
        !recommendations.BUTTONS_BLOCK &&
        buttonsCount > 0 &&
        buttonsCount >= questionCount / 2
      ) {
        this.props.setCompleteRecommendation(BUTTONS_BLOCK, true);
      } else if (
        recommendations.BUTTONS_BLOCK &&
        (buttonsCount === 0 || buttonsCount < questionCount / 2)
      ) {
        this.props.setCompleteRecommendation(BUTTONS_BLOCK, false);
      }

      if (!recommendations.GOAL_BLOCK && goalBlockCheck) {
        this.props.setCompleteRecommendation(GOAL_BLOCK, true);
      } else if (recommendations.GOAL_BLOCK && !goalBlockCheck) {
        this.props.setCompleteRecommendation(GOAL_BLOCK, false);
      }

      if (
        !recommendations.EMOJIS &&
        emojiCount > 0 &&
        questionCount > 0 &&
        emojiCount >= questionCount / 2
      ) {
        this.props.setCompleteRecommendation(EMOJIS, true);
      } else if (
        recommendations.EMOJIS &&
        (emojiCount === 0 || emojiCount < questionCount / 2)
      ) {
        this.props.setCompleteRecommendation(EMOJIS, false);
      }

      if (
        !recommendations.NOT_INCLUDED_ANSWER &&
        closedQuestionCount > 0 &&
        !defaultAnswerCheck
      ) {
        this.props.setCompleteRecommendation(NOT_INCLUDED_ANSWER, true);
      } else if (recommendations.NOT_INCLUDED_ANSWER && defaultAnswerCheck) {
        this.props.setCompleteRecommendation(NOT_INCLUDED_ANSWER, false);
      }
      if (!recommendations.SHORT_TEXT && questionCount > 0 && !shortTextCheck) {
        this.props.setCompleteRecommendation(SHORT_TEXT, true);
      } else if (
        recommendations.SHORT_TEXT &&
        (shortTextCheck || questionCount === 0)
      ) {
        this.props.setCompleteRecommendation(SHORT_TEXT, false);
      }
    } else {
      if (recommendations.SHORT_TEXT) {
        this.props.setCompleteRecommendation(TWO_BLOCK_MINIMUM, false);
      }
      if (recommendations.BUTTONS_BLOCK) {
        this.props.setCompleteRecommendation(BUTTONS_BLOCK, false);
      }
      if (recommendations.GOAL_BLOCK) {
        this.props.setCompleteRecommendation(GOAL_BLOCK, false);
      }
      if (recommendations.EMOJIS) {
        this.props.setCompleteRecommendation(EMOJIS, false);
      }
      if (recommendations.NOT_INCLUDED_ANSWER) {
        this.props.setCompleteRecommendation(NOT_INCLUDED_ANSWER, false);
      }
      if (recommendations.SHORT_TEXT) {
        this.props.setCompleteRecommendation(SHORT_TEXT, false);
      }
    }
  };

  componentDidMount() {
    const { diagramEngine, onChange } = this.props;
    diagramEngine.setCanvas(this.wrapperRef.current);
    const { selectAll, deselectAll, copy, paste, deleteItems } =
      this.getActions();
    // Add a keyboard listener
    this.setState({
      renderedNodes: true,
      windowListener: window.addEventListener("keydown", (event) => {
        try {
          const selectedItems = diagramEngine
            .getDiagramModel()
            .getSelectedItems();
          const ctrl = event.metaKey || event.ctrlKey;
          const shift = event.shiftKey;
          const isInputTargetType =
            event.target.type == "textarea" || event.target.tagName == "INPUT";
          let diagramModel = this.props.diagramEngine.diagramModel;
          if (isInputTargetType) return;
          // Prevent deletion of hovered node while creating a link to prevent loose link in port
          if (this.state.actionType === "link-created") return;
          // Select all
          if (event.keyCode === 65 && ctrl && selectAll) {
            events.track("Shortcut select all");
            this.selectAll(true);
            event.preventDefault();
            event.stopPropagation();
          }

          //Open side bar
          if (event.keyCode === 69 && ctrl && selectedItems.length) {
            events.track("Shortcut open configuration");
            this.props.onChange(
              diagramEngine.getDiagramModel().serializeDiagram(),
              {
                type: "open-side-bar",
                items: selectedItems,
              }
            );
          }
          //Save
          if (event.keyCode === 83 && ctrl) {
            console.log("SAVE");
          }
          //Duplicate
          if (event.keyCode === 68 && ctrl && selectedItems.length) {
            events.track("Shortcut duplicate");
            this.copySelectedItems(selectedItems);
            this.pasteSelectedItems(selectedItems);
          }
          //Find
          if (event.keyCode === 70 && ctrl) {
            console.log("FIND");
          }
          // Zoom in
          if (event.keyCode == 187) {
            events.track("Shortcut zoom in");
            let zoom = this.props.diagramEngine.diagramModel.zoom;
            this.props.diagramEngine.diagramModel.zoom = zoom + 10;
            this.props.diagramEngine.forceUpdate();
          }
          // Zoom out
          if (event.keyCode == 189) {
            events.track("Shortcut zoom out");
            let zoom = this.props.diagramEngine.diagramModel.zoom;
            if (zoom == 10) {
              zoom = 20;
            }
            this.props.diagramEngine.diagramModel.zoom = zoom - 10;
            this.props.diagramEngine.forceUpdate();
          }
          //zoom to 100
          if (event.keyCode == 48) {
            this.props.diagramEngine.diagramModel.zoom = 100;
            this.props.diagramEngine.forceUpdate();
          }
          //zoom to fit content
          if (event.keyCode == 49) {
            events.track("Shortcut zoom to conversation");
            zoomToContent(this.props.diagramEngine);
          }
          //zoom to fit item
          if (event.keyCode == 50 && selectedItems.length == 1) {
            events.track("Shortcut zoom to node");
            let diagramModel = this.props.diagramEngine.diagramModel;
            diagramModel.offsetX = -(selectedItems[0].x - 300);
            diagramModel.offsetY = -(selectedItems[0].y - 200);
            diagramModel.zoom = 150;
            this.props.diagramEngine.forceUpdate();
          }
          //Deselect node
          if (event.keyCode === 27 && selectedItems.length) {
            events.track("Shortcut unselect");
            this.selectAll(false);
            event.preventDefault();
            event.stopPropagation();
          }

          // Deselect all
          if (event.keyCode === 68 && ctrl && deselectAll) {
            this.selectAll(false);
            event.preventDefault();
            event.stopPropagation();
          }

          // Copy selected
          if (event.keyCode === 67 && ctrl && selectedItems.length && copy) {
            events.track("Shortcut copy");
            this.copySelectedItems(selectedItems);
          }

          // Paste from clipboard
          if (event.keyCode === 86 && ctrl && paste) {
            events.track("Shortcut paste");
            this.pasteSelectedItems(selectedItems);
          }

          // Undo
          if (event.keyCode === 90 && ctrl && !shift) {
            events.track("Shortcut undo");
            diagramEngine.diagramModel.undo(diagramEngine);
          }

          // Redo
          if (event.keyCode === 89 && ctrl && !shift) {
            diagramEngine.diagramModel.redo(diagramEngine);
          }

          // Delete all selected
          if (
            [8, 46].indexOf(event.keyCode) !== -1 &&
            selectedItems.length &&
            deleteItems
          ) {
            diagramModel.deactivateHistory();
            selectedItems.forEach((element) => {
              element.remove();
            });
            diagramModel.activateHistory();
            diagramModel.pushToHistory();

            onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
              type: "items-deleted",
              items: selectedItems,
            });

            this.forceUpdate();
          }
        } catch (error) {
          this.setState({ error: error });
        }
      }),
    });
    this.envCache = [];

    this.wrapperRef.current.onwheel = this.onWheel.bind(this);

    window.focus();
  }

  isPinchEvent(event) {
    return event.ctrlKey;
  }

  onWheel(event) {
    try {
      if (!this.props.diagramScrollingEnabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const { diagramEngine } = this.props;
      const diagramModel = diagramEngine.getDiagramModel();

      if (this.isPinchEvent(event)) {
        events.track("Zoom using the wheel");
        this.handleZoom(event, diagramModel);
      } else {
        this.handleScroll(event, diagramModel);
      }

      diagramEngine.enableRepaintEntities(
        diagramEngine.getDiagramModel().getSelectedItems()
      );

      this.forceUpdate();
    } catch (error) {
      this.setState({ error: error });
    }
  }

  handleScroll(event, diagramModel) {
    diagramModel.setOffsetX(diagramModel.getOffsetX() - event.deltaX);
    diagramModel.setOffsetY(diagramModel.getOffsetY() - event.deltaY);

    const finalOffsetY = diagramModel.getOffsetY();
    const finalOffsetX = diagramModel.getOffsetX();
    const { action, highlightedModel } = this.state;

    let wrapperBounds = this.wrapperRef.current.getBoundingClientRect();
    action &&
      action.selectionModels?.forEach((model) => {
        if (
          highlightedModel?.id != model.model.id &&
          (model.model instanceof NodeModel ||
            model.model instanceof PointModel ||
            model.model instanceof NodePortModel)
        ) {
          const difX = model.model.x - model.initialX;
          const difY = model.model.y - model.initialY;
          model.model.x =
            (event.clientX - wrapperBounds.left) /
              (diagramModel.getZoomLevel() / 100) -
            finalOffsetX;
          model.model.y =
            (event.clientY - wrapperBounds.top) /
              (diagramModel.getZoomLevel() / 100) -
            finalOffsetY;
          model.initialX = model.model.x - difX;
          model.initialY = model.model.y - difY;
        }
      });

    this.props.onChange(diagramModel.serializeDiagram(), {
      type: "diagram-scroll",
      items: null,
    });
  }

  handleZoom(event, diagramModel) {
    const { diagramEngine, onChange } = this.props;

    // distance between diagramModel and boundaries of whole canvas
    const initialOffsetX = diagramModel.getOffsetX();
    const initialOffsetY = diagramModel.getOffsetY();

    const actions = this.getActions();
    if (!actions.zoom) {
      return;
    }

    let dz = event.deltaY; // zoom difference

    const MIN_ZOOM = 20;
    const MAX_ZOOM = 100;

    // this is a mapping using the function f(x) = 100*e**(x/100-1)
    // f(100) = 1
    // f(-inf) = 0

    // Zoom is the f(x) or y in the function
    // x is the inverse of f(x)
    // We move across x (dz), to produce a movement in f(x)

    let prevZoom = diagramModel.getZoomLevel();

    let inversedPrevZoom = (1 + Math.log(prevZoom / 100)) * 100;
    let inversedNewZoom = inversedPrevZoom - dz;

    let newZoom = 100 * Math.exp(inversedNewZoom / 100 - 1);

    // zoom bounds
    if (newZoom >= MAX_ZOOM) newZoom = MAX_ZOOM;
    if (newZoom <= MIN_ZOOM) newZoom = MIN_ZOOM;

    let zoomScale = newZoom / prevZoom;

    var wrapperBounds = this.wrapperRef.current.getBoundingClientRect(); // the whole canvas

    var wrapperPointerPosX = event.clientX - wrapperBounds.left;
    var wrapperPointerPosY = event.clientY - wrapperBounds.top;

    let moveFromModelToPointerX =
      diagramModel.getOffsetX() - (wrapperPointerPosX / prevZoom) * 100;
    let moveFromModelToPointerY =
      diagramModel.getOffsetY() - (wrapperPointerPosY / prevZoom) * 100;

    // move center to pointer

    diagramModel.setOffsetX(
      diagramModel.getOffsetX() - moveFromModelToPointerX
    );
    diagramModel.setOffsetY(
      diagramModel.getOffsetY() - moveFromModelToPointerY
    );

    // zoom at model center

    diagramModel.setOffsetX(diagramModel.getOffsetX() / zoomScale);
    diagramModel.setOffsetY(diagramModel.getOffsetY() / zoomScale);

    // move center to original position

    // moving to the original position would be
    // diagramModel.setOffsetX(diagramModel.getOffsetX() + moveFromModelToPointerX / zoomScale  )

    diagramModel.setOffsetX(
      diagramModel.getOffsetX() + moveFromModelToPointerX
    );
    diagramModel.setOffsetY(
      diagramModel.getOffsetY() + moveFromModelToPointerY
    );

    diagramModel.setZoomLevel(newZoom);

    const { action, highlightedModel } = this.state;

    const finalOffsetX = diagramModel.getOffsetX();
    const finalOffsetY = diagramModel.getOffsetY();

    action &&
      action.selectionModels?.forEach((model) => {
        if (
          highlightedModel?.id != model.model.id &&
          (model.model instanceof NodeModel ||
            model.model instanceof PointModel ||
            model.model instanceof NodePortModel)
        ) {
          const difX = model.model.x - model.initialX;
          const difY = model.model.y - model.initialY;

          model.model.x =
            (event.clientX - wrapperBounds.left) / (newZoom / 100) -
            finalOffsetX;
          model.initialX = model.model.x - difX / zoomScale;
          model.model.y =
            (event.clientY - wrapperBounds.top) / (newZoom / 100) -
            finalOffsetY;
          model.initialY = model.model.y - difY / zoomScale;
        }
      });

    onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
      type: "diagram-zoom",
      zoom: newZoom,
    });
    this.forceUpdate();
  }

  copySelectedItems(selectedItems) {
    const { diagramEngine, onChange } = this.props;

    // Cannot copy anything without a node, so ensure some are selected
    const nodes = _.filter(
      selectedItems,
      (item) => item instanceof NodeModel || item instanceof NodePortModel
    );

    // If there are no nodes, do nothing
    if (!nodes.length) {
      return;
    }

    // Deserialize the existing diagramModel
    const flatModel = diagramEngine.diagramModel.serializeDiagram();

    // Create a new diagramModel to hold clipboard data
    const newModel = new DiagramModel(() => {});

    // Create map of GUIDs for replacement
    const gMap = {};

    // Track what was copied to send back to onChange
    const copied = [];

    // Iterate the nodes
    _.forEach(flatModel.nodes, (node) => {
      if (node.selected) {
        // Get the node instance, updated the GUID and deserialize
        const nodeOb = diagramEngine
          .getInstanceFactory(node._class)
          .getInstance();
        node.id = gMap[node.id] = Toolkit.UID();
        nodeOb.deSerialize(node);

        // Deserialize ports
        _.forEach(node.ports, (port) => {
          const portOb = diagramEngine
            .getInstanceFactory(port._class)
            .getInstance();
          port.id = gMap[port.id] = Toolkit.UID();
          port.links = [];
          portOb.deSerialize(port);
          nodeOb.addPort(portOb);
        });

        nodeOb.setSelected(true);
        newModel.addNode(nodeOb);
        copied.push(nodeOb);
      }
    });

    // Iterate the links
    _.forEach(flatModel.links, (link) => {
      if (link.selected) {
        const linkOb = diagramEngine
          .getInstanceFactory(link._class)
          .getInstance();
        link.id = gMap[link.id] = Toolkit.UID();

        // Change point GUIDs and set selected
        link.points.forEach((point) => {
          point.id = Toolkit.UID();
          point.selected = true;
        });

        // Deserialize the link
        linkOb.deSerialize(link);

        // Only add the target if the node was copied and the target exists
        if (gMap[link.target] && gMap[link.source]) {
          linkOb.setTargetPort(
            newModel
              .getNode(gMap[link.target])
              .getPortFromID(gMap[link.targetPort])
          );
        }

        // Add the source if it exists
        if (gMap[link.source]) {
          linkOb.setSourcePort(
            newModel
              .getNode(gMap[link.source])
              .getPortFromID(gMap[link.sourcePort])
          );
          newModel.addLink(linkOb);
          copied.push(linkOb);
        }
      }
    });

    let serializedClipboard = copied.map((item) => item.serialize());
    localStorage["diagramModelClipboard"] = JSON.stringify(serializedClipboard);

    onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
      type: "items-copied",
      items: copied,
    });
  }

  pasteSelectedItems() {
    const { diagramEngine, onChange } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();
    const clipboardDiagram = localStorage["diagramModelClipboard"];
    if (!clipboardDiagram) return;
    const clipboard = JSON.parse(clipboardDiagram);

    const nodes = _.filter(clipboard, (item) => {
      item = diagramEngine.getInstanceFactory(item._class).getInstance();
      return item instanceof NodeModel || item instanceof NodePortModel;
    });

    const links = _.filter(clipboard, (item) => {
      item = diagramEngine.getInstanceFactory(item._class).getInstance();
      return !(item instanceof NodeModel || item instanceof NodePortModel);
    });

    // Clear existing selections
    diagramModel.clearSelection();
    this.forceUpdate();

    diagramModel.deactivateHistory();

    // Create map of GUIDs for replacement
    const gMap = {};

    // Iterate the nodes
    _.forEach(nodes, (node) => {
      if (node.selected) {
        // Get the node instance, updated the GUID and deserialize
        const nodeOb = diagramEngine
          .getInstanceFactory(node._class)
          .getInstance();
        node.id = gMap[node.id] = Toolkit.UID();
        nodeOb.deSerialize(node);

        if (diagramModel.hasSecondHSMNode && nodeOb.getSecondHSM().secondHSMContent) {
          nodeOb.deleteSecondHSM()
        }

        // Deserialize ports
        _.forEach(node.ports, (port) => {
          const portOb = diagramEngine
            .getInstanceFactory(port._class)
            .getInstance();
          port.id = gMap[port.id] = Toolkit.UID();
          port.links = [];
          portOb.deSerialize(port);
          nodeOb.addPort(portOb);
        });

        nodeOb.x += PASTE_OFFSET;
        nodeOb.y += PASTE_OFFSET;

        nodeOb.setSelected(true);
        diagramModel.addNode(nodeOb);
      }
    });

    this.forceUpdate();

    // Iterate the links
    _.forEach(links, (link) => {
      const linkOb = diagramEngine
        .getInstanceFactory(link._class)
        .getInstance();
      link.id = gMap[link.id] = Toolkit.UID();

      // Change point GUIDs and set selected
      link.points.forEach((point) => {
        point.id = Toolkit.UID();
        point.selected = true;
      });

      // Deserialize the link
      linkOb.deSerialize(link);

      // Only add the target if the node was copied and the target exists
      if (gMap[link.target] && gMap[link.source]) {
        linkOb.setTargetPort(
          diagramModel
            .getNode(gMap[link.target])
            .getPortFromID(gMap[link.targetPort])
        );
      }

      // Add the source if it exists
      if (gMap[link.source]) {
        linkOb.setSourcePort(
          diagramModel
            .getNode(gMap[link.source])
            .getPortFromID(gMap[link.sourcePort])
        );
        diagramModel.addLink(linkOb);
      }
    });

    diagramModel.activateHistory();
    diagramModel.pushToHistory();

    this.forceUpdate();

    this.setState({ clipboard: null });

    onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
      type: "items-pasted",
      items: clipboard,
    });
  }

  pasteModel(model) {
    const { diagramEngine, onChange } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();

    const nodes = _.filter(model, (item) => {
      item = diagramEngine.getInstanceFactory(item._class).getInstance();
      return item instanceof NodeModel || item instanceof NodePortModel;
    });

    const links = _.filter(model, (item) => {
      item = diagramEngine.getInstanceFactory(item._class).getInstance();
      return !(item instanceof NodeModel || item instanceof NodePortModel);
    });

    // Clear existing selections
    diagramModel.clearSelection();
    this.forceUpdate();

    diagramModel.deactivateHistory();

    // Create map of GUIDs for replacement
    const gMap = {};

    // Iterate the nodes
    _.forEach(nodes, (node) => {
      if (node.selected) {
        // Get the node instance, updated the GUID and deserialize
        const nodeOb = diagramEngine
          .getInstanceFactory(node._class)
          .getInstance();
        node.id = gMap[node.id] = Toolkit.UID();
        nodeOb.deSerialize(node);

        // Deserialize ports
        _.forEach(node.ports, (port) => {
          const portOb = diagramEngine
            .getInstanceFactory(port._class)
            .getInstance();
          port.id = gMap[port.id] = Toolkit.UID();
          port.links = [];
          portOb.deSerialize(port);
          nodeOb.addPort(portOb);
        });

        nodeOb.x += PASTE_OFFSET;
        nodeOb.y += PASTE_OFFSET;

        nodeOb.setSelected(true);
        diagramModel.addNode(nodeOb);
      }
    });

    this.forceUpdate();

    // Iterate the links
    _.forEach(links, (link) => {
      const linkOb = diagramEngine
        .getInstanceFactory(link._class)
        .getInstance();
      link.id = gMap[link.id] = Toolkit.UID();

      // Change point GUIDs and set selected
      link.points.forEach((point) => {
        point.id = Toolkit.UID();
        point.selected = true;
      });

      // Deserialize the link
      linkOb.deSerialize(link);

      // Only add the target if the node was copied and the target exists
      if (gMap[link.target] && gMap[link.source]) {
        linkOb.setTargetPort(
          diagramModel
            .getNode(gMap[link.target])
            .getPortFromID(gMap[link.targetPort])
        );
      }

      // Add the source if it exists
      if (gMap[link.source]) {
        linkOb.setSourcePort(
          diagramModel
            .getNode(gMap[link.source])
            .getPortFromID(gMap[link.sourcePort])
        );
        diagramModel.addLink(linkOb);
      }
    });

    diagramModel.activateHistory();
    diagramModel.pushToHistory();

    this.forceUpdate();

    onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
      type: "items-pasted",
      items: model,
    });
  }

  selectAll(select) {
    const { diagramEngine, onChange } = this.props;
    const { nodes, links } = diagramEngine.diagramModel;
    const selected = [];

    // Select all nodes
    _.forEach(nodes, (node) => {
      node.setSelected(select);
      node.setError(false);
      selected.push(node);
    });

    // Select all links
    _.forEach(links, (link) => {
      // Prevent deselection of loose link while connecting
      if (!select && link.targetPort === null) {
        return;
      }
      link.setSelected(select);
      // Select all points
      link.points.forEach((point) => {
        point.setSelected(select);
      });
      selected.push(link);
    });

    // Repaint
    this.forceUpdate();

    const type = select ? "items-select-all" : "items-deselect-all";
    onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
      type,
      items: selected,
    });
  }
  focusTextArea(selectedItems) {
    let nodes = document.getElementsByClassName("node");
    let selectedNodeChildren = [];
    if (nodes.length !== 0) {
      Array.prototype.forEach.call(nodes, function (node) {
        if (node.outerHTML.includes(selectedItems[0].id)) {
          selectedNodeChildren.push(node.children[0].children);
        }
      });
    } else {
      return;
    }
    let textChild = [];
    if (selectedNodeChildren.length !== 0) {
      Array.prototype.forEach.call(selectedNodeChildren[0], function (child) {
        if (child.outerHTML.includes("textarea-wrapper")) {
          textChild.push(child.children);
        }
      });
    } else {
      return;
    }
    if (textChild.length !== 0) {
      Array.prototype.forEach.call(textChild[0], function (child) {
        if (child.nodeName == "TEXTAREA") {
          child.focus();
        }
      });
    }
  }

  /**
   * Gets a model and element under the mouse cursor
   */
  getMouseElement(event) {
    const { diagramModel } = this.props.diagramEngine;
    const { target } = event;

    // Look for a port
    let element = target.closest(".port[data-name]");
    if (element) {
      const nodeElement = target.closest(".node[data-nodeid]");
      return {
        model: diagramModel
          .getNode(nodeElement.getAttribute("data-nodeid"))
          .getPort(element.getAttribute("data-name")),
        element,
      };
    }

    // Look for answer port menu
    element = target.closest(".answer-port[draggable]");
    if (element) {
      const nodeElement = target.closest(".node[data-nodeid]");
      if (nodeElement) {
        return {
          model: diagramModel
            .getNode(nodeElement.getAttribute("data-nodeid"))
            .getPort(element.getAttribute("data-portid")),
          element,
        };
      }
    }

    // Look for a point
    element = target.closest(".point[data-id]");
    if (element) {
      return {
        model: diagramModel
          .getLink(element.getAttribute("data-linkid"))
          .getPointModel(element.getAttribute("data-id")),
        element,
      };
    }

    // Look for a link
    element = target.closest("[data-linkid]");
    if (element) {
      return {
        model: diagramModel.getLink(element.getAttribute("data-linkid")),
        element,
      };
    }

    // Look for a node
    element = target.closest(".node[data-nodeid]");
    if (element) {
      return {
        model: diagramModel.getNode(element.getAttribute("data-nodeid")),
        element,
      };
    }

    return null;
  }

  onMouseMove(event) {
    try {
      const { diagramEngine } = this.props;
      const {
        action,
        actionType: currentActionType,
        highlightedModel,
      } = this.state;
      const diagramModel = diagramEngine.getDiagramModel();
      const { left, top } = this.wrapperRef.current.getBoundingClientRect();
      const { multiselectDrag, canvasDrag, moveItems } = this.getActions();

      // Select items so draw a bounding box
      if (action instanceof SelectingAction && multiselectDrag) {
        const relative = diagramEngine.getRelativePoint(
          event.pageX,
          event.pageY
        );
        _.forEach(diagramModel.getNodes(), (node) => {
          if (action.containsElement(node.x, node.y, diagramModel)) {
            node.setSelected(true);
          }
        });

        _.forEach(diagramModel.getLinks(), (link) => {
          let allSelected = true;
          link.points.forEach((point) => {
            if (action.containsElement(point.x, point.y, diagramModel)) {
              point.setSelected(true);
            } else {
              allSelected = false;
            }
          });

          if (allSelected) {
            link.setSelected(true);
          }
        });

        action.mouseX2 = relative.x;
        action.mouseY2 = relative.y;
        this.setState({ action, actionType: "items-drag-selected" });
      } else if (action instanceof MoveItemsAction && moveItems) {
        // Translate the items on the canvas
        action.selectionModels.forEach((model) => {
          if (
            highlightedModel?.id != model.model.id &&
            (model.model instanceof NodeModel ||
              model.model instanceof PointModel ||
              model.model instanceof NodePortModel)
          ) {
            model.model.x =
              model.initialX +
              (event.pageX - this.state.action.mouseX) /
                (diagramModel.getZoomLevel() / 100);
            model.model.y =
              model.initialY +
              (event.pageY - this.state.action.mouseY) /
                (diagramModel.getZoomLevel() / 100);
          }
        });

        // Manage link over node
        if (currentActionType == "link-created") {
          let underCursorModel = this.getMouseElement(event);
          let newAction = null,
            newActionType = null,
            newhighlightedModel = null;
          if (
            underCursorModel &&
            underCursorModel.model instanceof NodeModel &&
            underCursorModel.model.id != highlightedModel?.id
          ) {
            // Get last point of link
            let lastPoint = action.selectionModels.filter(
              (model) => model.model instanceof PointModel
            )[0]?.model;

            // Get source node from last point of link
            let sourceNode = lastPoint?.link.sourcePort.parentNode;

            // Prevent highlighted of source node
            if (sourceNode?.id != underCursorModel.model.id) {
              // Deselect previous highlighted node
              highlightedModel?.setSelected(false);

              // Set current node under link cursor as selected
              underCursorModel.model.setSelected(true);
              newhighlightedModel = underCursorModel.model;
              newAction = new MoveItemsAction(
                event.pageX,
                event.pageY,
                diagramEngine
              );
              newActionType = "link-created";

              if (highlightedModel) {
                diagramEngine.enableRepaintEntities([
                  ...diagramEngine.getDiagramModel().getSelectedItems(),
                  highlightedModel,
                ]);
              }
            }
          }
          // Manage when the link leaves a selected node
          else if (
            underCursorModel &&
            underCursorModel.model instanceof PointModel &&
            highlightedModel
          ) {
            // Set previous selected node to unselected
            highlightedModel.setSelected(false);

            // Remove previously selected node from currently selected nodes
            action.selectionModels = action.selectionModels.filter(
              (model) => !(model.model instanceof NodeModel)
            );
            newhighlightedModel = null;
            newAction = action;
            newActionType = "node-deselected";
          } else if (
            underCursorModel &&
            underCursorModel.model instanceof PortModel &&
            highlightedModel
          ) {
            action.selectionModels.forEach((model) =>
              model.model.setSelected(true)
            );
          }
          if (newAction != null) {
            this.setState({
              highlightedModel: newhighlightedModel,
              action: newAction,
              actionType: newActionType,
            });
          }
        }

        // Determine actionType, do not override some mouse down
        const disallowed = ["link-created"];
        let actionType =
          disallowed.indexOf(currentActionType) === -1
            ? "items-moved"
            : currentActionType;
        if (
          action.selectionModels.length === 1 &&
          (action.selectionModels[0].model instanceof NodeModel ||
            action.selectionModels[0].model instanceof NodePortModel)
        ) {
          if (this.state.action.type !== "node-selected-to-drag") {
            actionType = "node-moved";
          }
        }
        this.setState({ actionType });
      } else if (action instanceof MoveCanvasAction && canvasDrag) {
        // Translate the actual canvas
        diagramModel.setOffset(
          action.initialOffsetX +
            (event.pageX - left - action.mouseX) /
              (diagramModel.getZoomLevel() / 100),
          action.initialOffsetY +
            (event.pageY - top - action.mouseY) /
              (diagramModel.getZoomLevel() / 100)
        );
        this.setState({ action, actionType: "canvas-drag" });
      } else if (action && action.type == "node-selected-to-drag") {
        console.log("READY TO DRAG");
      }
    } catch (error) {
      this.setState({ error: error });
    }
  }

  onMouseDown(event) {
    if (event.button === 2) {
      console.log("Mouse down right click");
      return;
    }

    try {
      const { diagramEngine } = this.props;
      const diagramModel = diagramEngine.getDiagramModel();
      const model = this.getMouseElement(event);
      const { selectItems, multiselect, multiselectDrag } = this.getActions();
      diagramEngine.clearRepaintEntities();

      // Check if this is the canvas
      if (model === null) {
        // Check for a multiple selection
        if (
          (event.shiftKey || this.props.cursor === "CURSOR_MODE_SELECT") &&
          multiselectDrag &&
          this.state.keyDown !== "pan"
        ) {
          const relative = diagramEngine.getRelativePoint(
            event.pageX,
            event.pageY
          );
          diagramModel.clearSelection();
          this.setState({
            action: new SelectingAction(relative.x, relative.y),
            actionType: "canvas-shift-select",
          });
        } else {
          // This is a drag canvas event
          const relative = diagramEngine.getRelativePoint(
            event.pageX,
            event.pageY
          );
          if (this.props.cursor !== "CURSOR_MODE_MOVE") {
            diagramModel.clearSelection();
          }
          if (this.props.selectedNode) {
            this.props.selectNode(null);
          }

          this.setState({
            action: new MoveCanvasAction(relative.x, relative.y, diagramModel),
            actionType: "canvas-click",
          });
        }
      } else if (model.model instanceof PortModel) {
        if (model.element.getAttribute("data-rbd-drag-handle-draggable-id")) {
          diagramModel.clearSelection();
          this.setState({
            action: new DragAnswerAction(
              event.pageX,
              event.pageY,
              event.target.offsetParent.offsetParent,
              diagramModel
            ),
            actionType: "drag-answer",
          });
          return;
        }

        const empty = _.isEqual(model.model.links, {});

        if (empty) {
          const { linkInstanceFactory } = diagramEngine;

          // This is a port element, we want to drag a link
          const relative = diagramEngine.getRelativeMousePoint(event);
          const link =
            (linkInstanceFactory && linkInstanceFactory.getInstance()) ||
            new LinkModel();

          // Only one link allowed by outgoing port
          if (Object.values(model.model.links).length !== 0) return;

          // Allow just for out ports
          if (model.model.name == "input") return;

          link.setSourcePort(model.model);

          link.getFirstPoint().updateLocation(relative);
          link.getLastPoint().updateLocation(relative);

          diagramModel.clearSelection();
          link.getLastPoint().setSelected(true);
          diagramModel.deactivateHistory();
          diagramModel.addLink(link);
          diagramModel.activateHistory();
          this.setState({
            action: new MoveItemsAction(
              event.pageX,
              event.pageY,
              diagramEngine
            ),
            actionType: "link-created",
          });
        } else {
          const inPort = model.model.in;
          const link = Object.values(model.model.links)[0];
          // Clean current selection
          model.model.setSelected(true);
          diagramModel.clearSelection();

          // Get target node
          const selectedModel =
            inPort === true
              ? link.sourcePort.parentNode
              : link.targetPort.parentNode;

          // Track event
          events.track(
            `Connector ${inPort === true ? "previous" : "next"} node click`
          );

          // Select target node
          selectedModel.setSelected(true);
          diagramModel.nodeSelected(selectedModel);

          // Zoom and offset for display of the selected node
          diagramModel.offsetX = -(selectedModel.x - 300);
          diagramModel.offsetY = -(selectedModel.y - 200);
          diagramModel.zoom = 100;

          // Repaint
          diagramEngine.forceUpdate();
        }
      } else if (selectItems && model.model) {
        // check for focused inputs
        const isInputTargetType =
          event.target.type == "textarea" || event.target.type == "input";

        // It's a direct click selection
        let deselect = false;
        const isSelected = model.model.isSelected();

        // Clear selections if this wasn't a shift key or a click on a selected element
        if ((!event.shiftKey && !isSelected) || (!multiselect && !isSelected)) {
          diagramModel.clearSelection(false, true);
        }

        // Is this a deselect or select?
        if ((event.shiftKey || isInputTargetType) && model.model.isSelected()) {
          model.model.setSelected(false);
          model.model.setError(false);
          deselect = true;
        } else if (!isInputTargetType) {
          model.model.setSelected(true);
          diagramModel.nodeSelected(model);
        }

        // Get the selected items and filter out point model
        const selected = diagramEngine.getDiagramModel().getSelectedItems();
        const filtered = _.filter(
          selected,
          (item) => !(item instanceof PointModel)
        );
        const isLink = model.model instanceof LinkModel;
        const isNode =
          model.model instanceof NodeModel ||
          model.model instanceof NodePortModel;
        const isPoint = model.model instanceof PointModel;

        // Determine action type
        let actionType = "items-selected";
        if (deselect && isLink) {
          actionType = "link-deselected";
        } else if (deselect && isNode) {
          actionType = "node-deselected";
        } else if (deselect && isPoint) {
          actionType = "point-deselected";
        } else if (
          (selected.length === 1 ||
            (selected.length === 2 && filtered.length === 1)) &&
          isLink
        ) {
          actionType = "link-selected";
          model.model.sourcePort?.setShowLinkRoute(true);
          model.model.targetPort?.setShowLinkRoute(true);
        } else if (
          selected.length === 1 &&
          isNode &&
          !event.shiftKey &&
          !event.altKey
        ) {
          actionType = "node-selected";
          this.props.diagramEngine.forceUpdate();
        } else if (selected.length === 1 && isPoint) {
          actionType = "point-selected";
        } else if (selected.length === 1 && event.altKey) {
          actionType = "node-selected-to-drag";
        } else {
          events.track("Shortcut multiple select");
        }
        this.setState({
          action: new MoveItemsAction(event.pageX, event.pageY, diagramEngine),
          actionType,
        });
      }
    } catch (error) {
      this.setState({ error: error });
    }
  }

  onMouseUp(event) {
    if (event.button === 2) {
      console.log("Mouse up right click");
      return;
    }
    try {
      const { diagramEngine, onChange } = this.props;
      const { action, actionType, highlightedModel } = this.state;
      const element = this.getMouseElement(event);
      const actionOutput = {
        type: actionType,
      };
      if (element === null) {
        // No element, this is a canvas event
        // actionOutput.type = 'canvas-event';
        actionOutput.event = event;
      } else if (action instanceof MoveItemsAction) {
        // Add the node model to the output
        actionOutput.model = element.model;
        // Check if we going to connect a link to something
        action.selectionModels.forEach((model) => {
          // Only care about points connecting to things or being created
          if (!model.model) return;
          if (model.model instanceof PointModel) {
            // Check if a point was created
            if (
              element.element.tagName === "circle" &&
              actionOutput.type !== "link-created"
            ) {
              actionOutput.type = "point-created";
            }

            if (
              element.model instanceof PortModel &&
              actionType !== "drag-answer"
            ) {
              // Connect the link
              model.model.getLink().setTargetPort(element.model);

              const link = model.model.getLink();

              // Avoid link connection on same node
              if (
                link.sourcePort?.parentNode.id === link.targetPort.parentNode.id
              ) {
                link.remove();
                return;
              }

              // Avoid link connection to output port
              if (link.targetPort.in !== true) {
                link.remove();
                return;
              }

              // Link was connected to a port, update the output
              actionOutput.type = "link-connected";
              delete actionOutput.model;
              actionOutput.linkModel = model.model.getLink();
              actionOutput.portModel = element.model;

              diagramEngine.diagramModel.pushToHistory();
            } else {
              if (model.model.getLink().getTargetPort() === null) {
                model.model.getLink().remove();
              }
            }
            // Manage when the mouse up is over a highlighted node
          } else if (
            (element.model instanceof NodeModel ||
              element.model instanceof PortModel) &&
            highlightedModel
          ) {
            // When mouseup over portModel, the node for connection will be parent node of port
            if (element.model instanceof PortModel) {
              element.model = element.model.parentNode;
            }
            // Get the id of input port of the highlighted node
            let inputPortId = Object.keys(element.model.ports).filter(
              (portId) => element.model.ports[portId].name == "input"
            )[0];

            // Get the input port element
            let inputPortElement = element.model.ports[inputPortId];
            let pointModel = action.selectionModels.filter(
              (model) => model.model instanceof PointModel
            )[0];
            let link = null;
            if (pointModel == undefined) {
              // Point model got deselected in the process of creating the link and right click
              link = Object.values(
                diagramEngine.diagramModel.getLinks()
              ).filter((link) => link.targetPort === null)[0];
            } else {
              link = pointModel.model.getLink();
            }

            // Connect the link
            link.setTargetPort(inputPortElement);
            diagramEngine.diagramModel.pushToHistory();

            // Avoid link connection on same node
            if (
              link.sourcePort?.parentNode.id === link.targetPort.parentNode.id
            ) {
              link.remove();
              return;
            }

            // Link was connected to a port, update the output
            actionOutput.type = "link-connected";
            delete actionOutput.model;
            actionOutput.linkModel = link;
            actionOutput.portModel = inputPortElement.model;
          } else if (
            element.model instanceof PointModel &&
            highlightedModel &&
            actionType === "node-moved"
          ) {
            let link = Object.values(
              diagramEngine.diagramModel.getLinks()
            ).filter((link) => link.targetPort === null)[0];
            if (link) {
              link.remove();
              return;
            }
          }
        });
      }

      const attachItems = [
        "items-selected",
        "items-drag-selected",
        "items-moved",
        "drag-answer",
        "node-deselected",
        "link-deselected",
      ];
      if (attachItems.indexOf(actionType) !== -1) {
        actionOutput.items = _.filter(
          diagramEngine.getDiagramModel().getSelectedItems(),
          (item) => !(item instanceof PointModel)
        );
      }
      if (actionType === "items-moved" || actionType === "drag-answer") {
        delete actionOutput.model;
      }

      diagramEngine.clearRepaintEntities();
      if (actionOutput.type !== "unknown") {
        onChange(
          diagramEngine.getDiagramModel().serializeDiagram(),
          actionOutput
        );
      }
      this.setState({
        action: null,
        actionType: "unknown",
        highlightedModel: null,
      });
    } catch (error) {
      this.setState({ error: error });
    }
  }

  onDoubleClick(event) {
    try {
      const { diagramEngine } = this.props;

      const selectedItems = diagramEngine.getDiagramModel().getSelectedItems();

      this.props.onChange(diagramEngine.getDiagramModel().serializeDiagram(), {
        type: "double-click",
        items: selectedItems,
      });
    } catch (error) {
      this.setState({ error: error });
    }
  }

  renderLinkLayerWidget() {
    const { diagramEngine } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();

    if (!this.props.diagramEngine.diagramModel.rendered) {
      return null;
    }

    if (!this.state.renderedNodes) {
      return null;
    }

    return (
      <LinkLayerWidget
        diagramEngine={diagramEngine}
        pointAdded={(point, event) => {
          event.stopPropagation();
          diagramModel.clearSelection(point);
          this.setState({
            action: new MoveItemsAction(
              event.pageX,
              event.pageY,
              diagramEngine
            ),
          });
        }}
      />
    );
  }

  renderSelector() {
    const { action } = this.state;
    const offsetWidth =
      (this.refs.canvas && this.refs.canvas.offsetWidth) || window.innerWidth;
    const offsetHeight =
      (this.refs.canvas && this.refs.canvas.offsetHeight) || window.innerHeight;

    if (!(action instanceof SelectingAction)) {
      return null;
    }

    const style = {
      width: Math.abs(action.mouseX2 - action.mouseX),
      height: Math.abs(action.mouseY2 - action.mouseY),
    };

    if (action.mouseX2 - action.mouseX < 0) {
      style.right = offsetWidth - action.mouseX;
    } else {
      style.left = action.mouseX;
    }

    if (action.mouseY2 - action.mouseY < 0) {
      style.bottom = offsetHeight - action.mouseY;
    } else {
      style.top = action.mouseY;
    }

    return <div className="selector" style={style} />;
  }

  render() {
    if (this.state.error) throw this.state.error;

    const { diagramEngine, backgroundImage } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();

    let styles = {};
    const zoom = diagramModel.getZoomLevel();

    if (backgroundImage) {
      styles = {
        backgroundImage: `url(${backgroundImage.url})`,
        backgroundSize: `${(backgroundImage.width * zoom) / 100}px ${
          (backgroundImage.height * zoom) / 100
        }px`,
        backgroundPosition: `${(diagramModel.getOffsetX() * zoom) / 100}px ${
          (diagramModel.getOffsetY() * zoom) / 100
        }px`,
      };
    }
    return (
      <div
        className="react-js-diagrams-canvas"
        ref={this.wrapperRef}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onDoubleClick={this.onDoubleClick.bind(this)}
        style={styles}
      >
        <NodeLayerWidget
          diagramEngine={diagramEngine}
          discretePosition={this.props.discretePosition}
        />
        {this.renderLinkLayerWidget()}
        {this.renderSelector()}
      </div>
    );
  }
}
