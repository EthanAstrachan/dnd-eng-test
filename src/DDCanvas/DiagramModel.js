import _ from "lodash";
import { LinkModel, NodeModel, PointModel } from "./Common";
import { BaseEntity } from "./BaseEntity";

const PASTE_OFFSET = 50;

export class DiagramModel extends BaseEntity {
  constructor(onHistoryChange) {
    super();
    this.links = {};
    this.nodes = {};
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 100;
    this.rendered = false;

    this.history = [];
    this.historyIndex = 0;
    this.enableHistory = true;

    this.historyChanged = onHistoryChange;
    this.hasSecondHSMNode = false;
  }

  deSerializeDiagram(object, diagramEngine, forceInactiveHistory = false) {
    this.enableHistory = false;

    this.deSerialize(object);
    this.offsetX = object.offsetX;
    this.offsetY = object.offsetY;
    this.zoom = object.zoom;

    let i = 0;
    // Deserialize nodes
    _.forEach(object.nodes, (node) => {
      const nodeOb = diagramEngine
        .getInstanceFactory(node._class)
        .getInstance();
      nodeOb.deSerialize(node);
      // Deserialize ports
      _.forEach(node.ports, (port) => {
        i++;
        const portOb = diagramEngine
          .getInstanceFactory(port._class)
          .getInstance();
        portOb.deSerialize(port);
        nodeOb.addPort(portOb);
      });

      this.addNode(nodeOb);
    });

    // Attach ports
    _.forEach(object.links, (link) => {
      const linkOb = diagramEngine
        .getInstanceFactory(link._class)
        .getInstance();
      linkOb.deSerialize(link);

      if (link.target) {
        const node = this.getNode(link.target);
        if (!node) {
          console.log("Target node not found, floating link");
          this.removeLink(linkOb);
          return;
        }
        linkOb.setTargetPort(node.getPortFromID(link.targetPort));
      } else {
        console.log("Target node reference not found, floating link");
        this.removeLink(linkOb);
        return;
      }

      if (link.source) {
        const node = this.getNode(link.source);
        if (!node) {
          console.log("Source node not found, floating link");
          this.removeLink(linkOb);
          return;
        }
        linkOb.setSourcePort(node.getPortFromID(link.sourcePort));
      } else {
        console.log("Source node reference not found, floating link");
        this.removeLink(linkOb);
        return;
      }
      this.addLink(linkOb);
    });

    this.rendered = false;
    if (!forceInactiveHistory) {
      this.enableHistory = true;
      if (this.history.length === 0) {
        this.pushToHistory();
      }
      this.historyChanged();
    }
  }

  serializeDiagram() {
    return {
      ...this.serialize(),
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      zoom: this.zoom,
      links: _.map(this.links, (link) => link.serialize()),
      nodes: _.map(this.nodes, (node) => node.serialize()),
    };
  }

  deactivateHistory() {
    this.enableHistory = false;
  }

  activateHistory() {
    this.enableHistory = true;
  }

  pushToHistory() {
    if (this.enableHistory === false) return;

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.serializeDiagram());
    this.historyIndex = this.history.length - 1;
    console.log("PUSH HISTORY", this.history, this.historyIndex);
    this.historyChanged();
  }

  updateHistoryDueToSecondHSM() {
    this.history[this.historyIndex] = this.serializeDiagram();
    console.log("UPDATE HISTORY", this.history, this.historyIndex);
  }

  canUndo() {
    return (
      this.historyIndex - 1 < this.history.length && this.historyIndex >= 1
    );
  }

  cleanModel() {
    Object.values(this.links).forEach((link) => this.removeLink(link));
    Object.values(this.nodes).forEach((node) => this.removeNode(node));
  }

  undo(diagramEngine) {
    if (!this.canUndo()) return;
    this.deactivateHistory();
    this.historyIndex -= 1;
    let serializedModelSnapshot = this.history[this.historyIndex];
    console.log("UNDO", this.historyIndex, serializedModelSnapshot);

    Object.values(this.links).forEach((link) => this.removeLink(link));
    Object.values(this.nodes).forEach((node) => this.removeNode(node));
    this.activateHistory();
    this.deSerializeDiagram(serializedModelSnapshot, diagramEngine);
    this.historyChanged();
  }

  canRedo() {
    return this.historyIndex + 1 < this.history.length;
  }

  redo(diagramEngine) {
    if (!this.canRedo()) return;
    this.deactivateHistory();
    this.historyIndex += 1;

    let serializedModelSnapshot = this.history[this.historyIndex];
    console.log("REDO", this.historyIndex, serializedModelSnapshot);

    Object.values(this.links).forEach((link) => this.removeLink(link));
    Object.values(this.nodes).forEach((node) => this.removeNode(node));
    this.activateHistory();
    this.deSerializeDiagram(serializedModelSnapshot, diagramEngine);
    this.historyChanged();
  }

  clearSelection(ignore, supressListener) {
    _.forEach(this.getSelectedItems(), (element) => {
      if (ignore && ignore.getID() === element.getID()) {
        return;
      }

      if (
        element instanceof PointModel &&
        element.link &&
        element.link.sourcePort &&
        !element.link.targetPort
      ) {
        return;
      }

      element.setSelected(false); //TODO dont fire the listener
      if (element instanceof LinkModel) {
        element.sourcePort.setShowLinkRoute(false);
        element.targetPort.setShowLinkRoute(false);
      }
    });
    _.forEach(this.getErrorItems(), (element) => {
      if (ignore && ignore.getID() === element.getID()) {
        return;
      }
      element.setError(false); //TODO dont fire the listener
    });
    if (supressListener) {
      return;
    }
    this.itterateListeners((listener) => {
      if (listener.selectionCleared) {
        listener.selectionCleared();
      }
    });
  }

  getSelectedItems() {
    return [
      // Nodes
      ..._.filter(this.nodes, (node) => node.isSelected()),
      // Points
      ..._.filter(
        _.flatMap(this.links, (node) => node.points),
        (port) => port.isSelected()
      ),
      // Links
      ..._.filter(this.links, (link) => link.isSelected()),
    ];
  }

  getErrorItems() {
    return [
      // Nodes
      ..._.filter(this.nodes, (node) => node.isError()),
    ];
  }

  setZoomLevel(zoom) {
    this.zoom = zoom;
    this.itterateListeners((listener) => {
      if (listener.controlsUpdated) {
        listener.controlsUpdated();
      }
    });
  }

  setOffset(offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.itterateListeners((listener) => {
      if (listener.controlsUpdated) {
        listener.controlsUpdated();
      }
    });
  }

  setOffsetX(offsetX) {
    this.offsetX = offsetX;
    this.itterateListeners((listener) => {
      if (listener.controlsUpdated) {
        listener.controlsUpdated();
      }
    });
  }

  setOffsetY(offsetY) {
    this.offsetY = offsetY;
    this.itterateListeners((listener) => {
      if (listener.controlsUpdated) {
        listener.controlsUpdated();
      }
    });
  }

  setHasSecondHSMNode(value) {
    this.hasSecondHSMNode = value;
  }

  getHasSecondHSMNode() {
    return this.hasSecondHSMNode;
  }

  getOffsetY() {
    return this.offsetY;
  }

  getOffsetX() {
    return this.offsetX;
  }

  getZoomLevel() {
    return this.zoom;
  }

  getNode(node) {
    if (node instanceof NodeModel) {
      return node;
    }
    if (!this.nodes[node]) {
      return null;
    }
    return this.nodes[node];
  }

  getLink(link) {
    if (link instanceof LinkModel) {
      return link;
    }
    if (!this.links[link]) {
      return null;
    }
    return this.links[link];
  }

  addLink(link) {
    link.addListener({
      entityRemoved: () => {
        this.removeLink(link);
      },
    });
    this.links[link.getID()] = link;
    this.itterateListeners((listener) => {
      if (listener.linksUpdated) {
        listener.linksUpdated();
      }
    });

    this.pushToHistory();

    return link;
  }

  addNode(node) {
    this.nodes[node.getID()] = node;

    node.addListener({
      entityRemoved: () => {
        this.removeNode(node);
      },
      entityUpdated: (property, value) => {
        console.log("UPDATED", node, property, value);
        this.pushToHistory();
      },
    });

    this.itterateListeners((listener) => {
      if (listener.nodesUpdated) {
        listener.nodesUpdated();
      }
    });

    this.pushToHistory();

    return node;
  }

  cloneNode(node) {
    let cloneNode = node.clone();
    node.selected = false;

    cloneNode.x = node.x + PASTE_OFFSET;
    cloneNode.y = node.y + PASTE_OFFSET;
    cloneNode.selected = true;

    return this.addNode(cloneNode);
  }

  removeLink(link) {
    if (link instanceof LinkModel) {
      delete this.links[link.getID()];
      this.itterateListeners((listener) => {
        if (listener.linksUpdated) {
          listener.linksUpdated();
        }
      });
      return;
    } else {
      delete this.links[_.toString(link)];
      this.itterateListeners((listener) => {
        if (listener.linksUpdated) {
          listener.linksUpdated();
        }
      });
    }

    this.pushToHistory();
  }

  removeNode(node) {
    if (node instanceof NodeModel) {
      delete this.nodes[node.getID()];
      this.itterateListeners((listener) => {
        if (listener.nodesUpdated) {
          listener.nodesUpdated();
        }
      });

      if (node.secondHSM?.secondHSMContent) {
        const secondHSMNode = this.getNode(node.secondHSM.secondHSMNodeId);
        this.removeNode(secondHSMNode);
        this.setHasSecondHSMNode(false);
      }

      if (node.isSecondHSM) {
        const parentNode = this.getNode(node.parentHSMId);
        if (parentNode) {
          parentNode.deleteSecondHSM();
        }
        this.setHasSecondHSMNode(false);
      }
    } else {
      delete this.nodes[_.toString(node)];
      this.itterateListeners((listener) => {
        if (listener.nodesUpdated) {
          listener.nodesUpdated();
        }
      });
    }
    this.pushToHistory();
  }

  nodeSelected(node) {
    this.itterateListeners((listener) => {
      if (listener.selectionChanged) {
        listener.selectionChanged(node);
      }
    });
  }

  getLinks() {
    return this.links;
  }

  getNodes() {
    return this.nodes;
  }
}
