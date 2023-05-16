import React, { useEffect, useState } from "react";
import getLanguage from "getLanguage.js";
import languages from "./languages";
import constants from "../../assets/constants";
import "./CreateDoubleHSMModal.scss";
import { Modal } from "antd";
import SelectDropdown from "Components/SelectDropdown";
import SelectHSMDropdown from "Components/SelectHSMDropdown";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { operations } from "views/Conversation/duck";
import { connect } from "react-redux";
import TextInput from "Components/TextInput";

const language = languages[getLanguage()];
const CreateDoubleHSMModalComponent = (props) => {
    const initialState = {
        secondHSM: null,
        secondHSMSendTime: {
            value: "10",
            type: 'Minutes'
        },
        isValidTimeFrame: true,
    };

    const [state, setState] = useState(initialState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(operations.fetchHSMList())
    }, [dispatch])

    useEffect(() => {
        const {value, type} = state.secondHSMSendTime;
        let valid = false;
        const intValue = parseInt(value);

        if (type === 'Minutes' && Number.isInteger(intValue) && intValue <= 60 && intValue > 0) {
            valid = true
        } else {
            if (Number.isInteger(intValue) && intValue <= 24 && intValue > 0) {
                valid = true
            }
        }

        setState({...state, isValidTimeFrame: valid})

    }, [state.secondHSMSendTime])

    const validForm =
        state.isValidTimeFrame && state.secondHSM

    const createDoubleHSM = () => {
        if (
            [...new Set(state.targetEvents.map((target) => target?.url))].length !=
            state.targetEvents.map((target) => target?.url).length
        ) {
            toast.error(language.repeatedUrls, {
            position: "top-center",
            autoClose: false,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "dark",
            });
            return;
        }

        const targetEvents = [];

        state.targetEvents.map((target) => {
            const targetEvent = {
            type: target.type,
            };
            if (
            [
                constants.TARGET_EVENT_BUTTON_LINK,
                constants.TARGET_EVENT_LINK,
            ].includes(target.type) &&
            target.url
            ) {
            targetEvent["url"] = target.url;
            targetEvent["expectationValue"] = Math.min(
                Math.max(Number(target.expectationValue), 0),
                100
            );
            }
            targetEvents.push(targetEvent);
        });

        props.node.updateGoalMeasurement({
            campaignGoal: state.campaignGoal,
            targetEvents: targetEvents,
        });

        props.setConfigured();
        props.forceUpdate();
    };

    // const renderTriggerComponent = (value, defaultValue, field) => {
    //     if (field == "target") {
    //         const targetType = value ? value.toLowerCase() : "";
    //         value = TARGET_EVENT_OPTIONS.filter((e) => e.value == value)[0]?.label;
    //         return (
    //         <button className={`${targetType ? "selected" : ""}`}>
    //             <div className="selected-item-container">
    //             <div
    //                 className={targetType ? `${targetType}-icon` : "gold-goal-icon"}
    //             ></div>
    //             <p className="r">{value || defaultValue}</p>
    //             </div>
    //             <div className="dropdown-arrow" />
    //         </button>
    //         );
    //     }
    //     return (
    //         <button className={`${value ? "selected" : ""}`}>
    //         <p className="r">{value || defaultValue}</p>
    //         <div className="dropdown-arrow" />
    //         </button>
    //     );
    // };

    const renderHSMDropdownItem = (name, content) => {
        return (
            <div>
                <p className="r lh-22 hsm-dropdown-item-title">{name}</p>
                <p className="r lh-22 hsm-dropdown-item-content">{content}</p>
            </div>
        );
    };

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
                    display={(item) => renderHSMDropdownItem(item.name, item.content)}
                    toSearchStr={(item) => (item.name + item.content).toLowerCase()}
                    onSelect={(target) => {setState({ ...state, secondHSM: target})}}
                    hideOnOptionClick={true}
                    // triggerComponent={
                    //     renderTriggerComponent(
                    //         props.hsmList.filter((e) => e.id == state.secondHSM.id),
                    //         language.selectTemplate
                    //     )
                    // }
                />
            </div>
            <div className="dashed-divider"></div>
            <div className="select-double-hsm-time-container">
                <div className="select-hsm-time-interval-title">
                    <span className="double-hsm-circle">
                        <p>2</p>
                    </span>
                    <p>{language.defineTimeInterval}</p>
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
                    {!state.isValidTimeFrame ? language.invalidSecondHSMTime : null}
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
