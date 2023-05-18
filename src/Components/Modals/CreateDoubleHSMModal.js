import React, { useEffect, useState } from "react";
import getLanguage from "getLanguage.js";
import languages from "./languages";
import "./CreateDoubleHSMModal.scss";
import { Modal } from "antd";
import SelectDropdown from "Components/SelectDropdown";
import SelectHSMDropdown from "Components/SelectHSMDropdown";
import { useDispatch } from "react-redux";
import { operations } from "views/Conversation/duck";
import { connect } from "react-redux";
import TextInput from "Components/TextInput";
import {HSMNodeModel} from "views/Conversation/DDCustom/main";
import {Tooltip} from "antd";

const language = languages[getLanguage()];
const CreateDoubleHSMModalComponent = (props) => {
    
    const initialState = {
        secondHSM: null,
        secondHSMSendTime: {
            value: "10",
            type: language.minutes
        },
        isValidTimeFrame: false,
    };

    const [state, setState] = useState(initialState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(operations.fetchHSMList())
    }, [dispatch])


    // Displays the correct second HSM when the modal is loaded
    useEffect(() => {
        const {node} = props;
        if (node.secondHSM.secondHSMContent) {
            const secondHSMNode = new HSMNodeModel();
            secondHSMNode.deSerialize(node.secondHSM.secondHSMContent)
            const {name, content} = secondHSMNode.hsm;
            setState({...state,
                secondHSM: {name, content},
                secondHSMSendTime: node.secondHSM.secondHSMSendTime
            })
        }
    }, [props.show])

    useEffect(() => {
        const {value, type} = state.secondHSMSendTime;
        let valid = false;
        const intValue = parseInt(value);

        if (type === language.minutes && Number.isInteger(intValue) && intValue <= 1440 && intValue > 0) {
            valid = true
        } else if (type === language.hours) {
            if (Number.isInteger(intValue) && intValue <= 24 && intValue > 0) {
                valid = true
            }
        }

        setState({...state, isValidTimeFrame: valid})

    }, [state.secondHSMSendTime])

    const validForm =
        state.isValidTimeFrame && state.secondHSM

    const createDoubleHSM = async () => {
        await props.closeModal()
        const {node, diagramEngine} = props;
        const {secondHSM, secondHSMSendTime} = state;

        let secondHSMNodeId = node.secondHSM.secondHSMNodeId;
        let diagramModel = diagramEngine.getDiagramModel();
        let nodeModel = new HSMNodeModel({...secondHSM, isSecondHSM: true, parentHSMId: node.getID()});

        if (!node.secondHSM.secondHSMContent) {
            nodeModel.x = props.node.x + 400;
            nodeModel.y = props.node.y;
            secondHSMNodeId = nodeModel.getID();
        } 
        else {
            const secondHSMNode = diagramModel.getNode(node.secondHSM.secondHSMNodeId);
            nodeModel.id = secondHSMNode.getID();
            nodeModel.x = secondHSMNode.x;
            nodeModel.y = secondHSMNode.y;
        }

        diagramModel.addNode(nodeModel);
        node.addSecondHSM(nodeModel, secondHSMSendTime, secondHSMNodeId)
        node.addSecondHSMLink(diagramEngine);
        diagramModel.updateHistoryDueToSecondHSM();
        diagramModel.setHasSecondHSMNode(true);
        diagramEngine.forceUpdate();
    };

    const renderHSMDropdownItem = (hsm) => {
        return (
            <div>
                <p className="r lh-22 hsm-dropdown-item-title">{hsm.name}</p>
                <p className="r lh-22 hsm-dropdown-item-content">{hsm.content}</p>
            </div>
        );
    };

    const renderHsmTooltip = (hsm) => {
        if (hsm.status == "PAUSED") {
            const metaDoc =
            "developers.facebook.com/docs/whatsapp/message-templates/guidelines#template-pausing";
            return (
              <>
                <p className="paused">{language.hsmPausedText}</p>
                <a href={`https://${metaDoc}`} target="_blank">
                  {metaDoc}
                </a>
              </>
            );
          } else {
            return (
              <>
                <p>{hsm.header?.text ? hsm.header.text : hsm.header?.url}</p>
                <p>{hsm.content}</p>
                <p>{hsm.footer?.text ? hsm.footer.text : ""}</p>
                {hsm.buttons?.options.map((button) => {
                  return (
                    <p key={hsm.buttons?.options.indexOf(button)}>
                      {button.text}
                    </p>
                  );
                })}
              </>
            );
          }
    }

    const renderTimeDropdownItem = (timeFrame) => {
        const icon =
            timeFrame === state.secondHSMSendTime.type ? <div className="icon--check" /> : null;

        return (
            <>
                <p className="r lh-22">{timeFrame}</p>
                {icon}
            </>
        );
    }

    const renderTooltip = () => {
        return (
            <div>
                 <p>{language.secondHSMTimingReminder}</p>
            </div>
           
        );
      };

    const getModalBody = () => {
        return (
        <div className="double-hsm-body">
            <div className="double-hsm-description-container">
                <p>{language.doubleHSMD}</p>
            </div>
            <div className="select-double-hsm-message-container">
                <div className="double-hsm-select-message-title">
                    <span className="double-hsm-circle">
                        <p>1</p>
                    </span>
                    <p>{language.selectDoubleHSMTemplate}</p>
                </div>
                <SelectHSMDropdown
                    options={props.hsmList}
                    display={(item) => renderHSMDropdownItem(item)}
                    toSearchStr={(item) => (item.name + item.content).toLowerCase()}
                    onSelect={(target) => {setState({ ...state, secondHSM: {...target, _class: "HSMNodeModel"}})}}
                    hideOnOptionClick={true}
                    value={state.secondHSM}
                    renderHsmTooltip={renderHsmTooltip}
                />
            </div>
            <div className="dashed-divider"></div>
            <div className="select-double-hsm-time-container">
                <div className="select-hsm-time-interval-title">
                    <span className="double-hsm-circle">
                        <p>2</p>
                    </span>
                    <p>{language.defineTimeInterval}</p>
                    <Tooltip
                        overlayClassName="hsm-select-timing-reminder"
                        placement="left"
                        title={renderTooltip()}
                        >
                            <div>
                                <i class="fa fa-exclamation-circle" />
                            </div>
                    </Tooltip>
                </div>
                <div className="select-hsm-time-interval-container">
                    <div className="select-hsm-time-interval-description">{language.secondHSMTimeMessage}</div>
                    <TextInput
                        className="select-hsm-time-interval-input"
                        type="text"
                        onChange={({ target: { value } }) => {
                            setState({...state, secondHSMSendTime: {...state.secondHSMSendTime, value} });
                        }}
                        value={state.secondHSMSendTime.value}
                        placeholder={language.hsmPH}
                    />
                    <SelectDropdown
                        className="select-hsm-time-interval-dropdown"
                        options={[language.minutes, language.hours]}
                        display={(item) => renderTimeDropdownItem(item)}
                        onSelect={(target) => setState({...state, secondHSMSendTime: {...state.secondHSMSendTime, type: target}})}
                        value={state.secondHSMSendTime.type}
                    />
                </div>
                <div className="invalid-hsm-send-time">
                    {!state.isValidTimeFrame && state.secondHSMSendTime.type ? language.invalidSecondHSMTime : null}
                </div>
            </div>
        </div>
        );
    };  
  const renderFooter = () => {
    return (
      <div className="create-buttons-container">
        <button
          className={`create-double-hsm-now ${validForm && "is-valid"}`}
          onClick={createDoubleHSM}
          disabled={!validForm}
        >
          <p>{language.createDoubleHSM}</p>
        </button>
        <div className="cancel-button" onClick={props.closeModal}>
            {language.cancel}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={"HSM x2"}
      wrapClassName="create-double-hsm-modal"
      footer={renderFooter()}
      visible={props.show}
      onCancel={props.closeModal}
      closeIcon={<div class="close-icon"></div>}
      maskClosable={false}
      centered
      closable={
        props.configured || !props.node.hsm || !props.node.hasButtonLink()
      }
    >
      {getModalBody()}
    </Modal>
  );
};

const mapStateToProps = (state) => {
    const { conversationReducer } = state;
  
    return {
        hsmList: conversationReducer.hsmList,
    };
  };
  
  const CreateDoubleHSMModal = connect(
    mapStateToProps,
    null
  )(CreateDoubleHSMModalComponent);

export default CreateDoubleHSMModal;
