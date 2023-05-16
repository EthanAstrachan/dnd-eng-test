import React, {useState } from "react";
import CreateDoubleHSMModal from "./Modals/CreateDoubleHSMModal";

import "./SetDoubleHSMButton.scss";

const SetDoubleHSMButton = (props) => {
  const [state, setState] = useState({
    hover: false,
    configured: false,
    showModal: false,
  });

  const renderComponent = () => {
    const { hover, configured } = state;

    if (!hover && !configured) {
      return (
          <div className="setting-hsm">
            <p>HSM</p>
            <div className="hsm-icon"/>
          </div>
        
      );
    }
    if (!hover && configured) {
      return null;
    }
    if (hover) {
      return (
        <div
          className="setting-hsm hover"
          onClick={() => {
            setState({
              ...state,
              showModal: true,
            });
          }}
        >
          <div>
            <p>HSM</p>
          </div>
          <div className="purple-hsm-icon"></div>
        </div>
      );
    }
  };
  const renderCreateTargetModal = () => {
    return (
      <CreateDoubleHSMModal
        show={state.showModal}
        closeModal={() => setState({ ...state, showModal: false })}
        configured={state.configured}
        setConfigured={() =>
          setState({ ...state, configured: true, showModal: false })
        }
        node={props.node}
        forceUpdate={props.forceUpdate}
        diagramEngine={props.diagramEngine}
      />
    );
  };

  return (
    <div
      className="double-hsm-block"
      onMouseEnter={() => setState({ ...state, hover: true })}
      onMouseLeave={() => setState({ ...state, hover: false })}
    >
      {renderComponent()}
      {renderCreateTargetModal()}
    </div>
  );
};

export default SetDoubleHSMButton;
